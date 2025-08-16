import { AIService } from './ai';
import PromptTemplateManager from './promptTemplates';
import { logger } from '../server';

export interface QualityMetrics {
  overall_score: number;
  relevance: number;
  clarity: number;
  empathy: number;
  completeness: number;
  professionalism: number;
  confidence: number;
  strengths: string[];
  improvements: string[];
}

export interface EscalationAnalysis {
  escalation_level: 'immediate' | 'recommended' | 'monitor' | 'standard';
  confidence: number;
  reasoning: string;
  suggested_action: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  risk_factors: string[];
}

export class QualityAssessmentService {
  private aiService: AIService;
  private promptManager: PromptTemplateManager;

  constructor(aiService: AIService) {
    this.aiService = aiService;
    this.promptManager = new PromptTemplateManager();
  }

  async assessResponseQuality(
    originalQuery: string,
    response: string,
    customerContext: Record<string, any> = {}
  ): Promise<QualityMetrics> {
    try {
      const prompt = this.promptManager.renderTemplate('response_quality_assessment', {
        originalQuery,
        response,
        customerContext: JSON.stringify(customerContext, null, 2)
      });

      const aiResponse = await this.aiService.processQuery(
        prompt,
        {},
        'system-quality-assessment'
      );

      return this.parseQualityMetrics(aiResponse.response);

    } catch (error) {
      logger.error('Quality assessment failed', { error });
      return this.getDefaultQualityMetrics();
    }
  }

  async detectEscalationNeeds(
    query: string,
    customerContext: {
      sentiment?: string;
      interactionCount?: number;
      previousInteractions?: Array<{ type: string; content: string; sentiment?: string }>;
      customerTier?: string;
      issueComplexity?: string;
      responseTime?: number;
      previousEscalations?: number;
    }
  ): Promise<EscalationAnalysis> {
    try {
      const prompt = this.promptManager.renderTemplate('escalation_detection', {
        query,
        sentiment: customerContext.sentiment || 'neutral',
        interactionCount: customerContext.interactionCount || 0,
        previousInteractions: customerContext.previousInteractions || [],
        customerTier: customerContext.customerTier || 'standard',
        issueComplexity: customerContext.issueComplexity || 'low',
        responseTime: customerContext.responseTime || 0,
        previousEscalations: customerContext.previousEscalations || 0
      });

      const aiResponse = await this.aiService.processQuery(
        prompt,
        {},
        'system-escalation-detection'
      );

      return this.parseEscalationAnalysis(aiResponse.response);

    } catch (error) {
      logger.error('Escalation detection failed', { error });
      return this.getDefaultEscalationAnalysis();
    }
  }

  async scoreResponseRelevance(query: string, response: string): Promise<number> {
    try {
      // Quick relevance scoring using keyword matching and semantic analysis
      const queryWords = this.extractKeywords(query.toLowerCase());
      const responseWords = this.extractKeywords(response.toLowerCase());
      
      // Calculate keyword overlap
      const overlap = queryWords.filter(word => responseWords.includes(word));
      const keywordScore = Math.min(1.0, overlap.length / Math.max(queryWords.length, 1));

      // Length penalty for too short responses
      const lengthScore = Math.min(1.0, response.length / 100);

      // Question answering score
      const hasQuestionMarks = (query.match(/\?/g) || []).length;
      const providesAnswers = response.length > 50 ? 0.8 : 0.3;
      const answerScore = hasQuestionMarks > 0 ? providesAnswers : 0.7;

      // Combine scores
      const relevanceScore = (keywordScore * 0.4 + lengthScore * 0.3 + answerScore * 0.3);
      
      return Math.round(relevanceScore * 10); // Scale to 0-10

    } catch (error) {
      logger.warn('Relevance scoring failed', { error });
      return 5; // Default middle score
    }
  }

  async calculateResponseConfidence(
    query: string,
    response: string,
    context: Record<string, any> = {}
  ): Promise<number> {
    try {
      let confidence = 0.5; // Base confidence

      // Response length factor
      if (response.length > 100) confidence += 0.1;
      if (response.length > 200) confidence += 0.1;
      if (response.length < 20) confidence -= 0.2;

      // Specificity factors
      if (response.includes('specifically') || response.includes('exactly')) confidence += 0.05;
      if (response.includes('might') || response.includes('possibly')) confidence -= 0.05;

      // Action orientation
      if (response.includes('will') || response.includes('can help')) confidence += 0.1;
      if (response.includes('unable') || response.includes('cannot')) confidence -= 0.1;

      // Context utilization
      if (Object.keys(context).length > 0) {
        const contextUsed = Object.keys(context).some(key => 
          response.toLowerCase().includes(key.toLowerCase()) ||
          response.toLowerCase().includes(context[key]?.toString().toLowerCase())
        );
        if (contextUsed) confidence += 0.15;
      }

      // Professional language
      const professionalWords = ['understand', 'assist', 'help', 'resolve', 'ensure'];
      const professionalCount = professionalWords.filter(word => 
        response.toLowerCase().includes(word)
      ).length;
      confidence += Math.min(0.1, professionalCount * 0.02);

      // Cap confidence between 0.1 and 0.95
      return Math.min(0.95, Math.max(0.1, confidence));

    } catch (error) {
      logger.warn('Confidence calculation failed', { error });
      return 0.6; // Default confidence
    }
  }

  async generateQualityReport(
    interactions: Array<{
      query: string;
      response: string;
      confidence_score?: number;
      processing_time_ms?: number;
      created_at: string;
    }>
  ): Promise<{
    average_quality: number;
    total_interactions: number;
    quality_trend: 'improving' | 'declining' | 'stable';
    recommendations: string[];
    metrics_breakdown: {
      high_quality: number;
      medium_quality: number;
      low_quality: number;
    };
  }> {
    try {
      const qualityScores = await Promise.all(
        interactions.map(async (interaction) => {
          const quality = await this.assessResponseQuality(
            interaction.query,
            interaction.response
          );
          return {
            score: quality.overall_score,
            date: interaction.created_at
          };
        })
      );

      const averageQuality = qualityScores.reduce((sum, q) => sum + q.score, 0) / qualityScores.length;

      // Calculate trend (compare first half vs second half)
      const midpoint = Math.floor(qualityScores.length / 2);
      const firstHalf = qualityScores.slice(0, midpoint);
      const secondHalf = qualityScores.slice(midpoint);
      
      const firstHalfAvg = firstHalf.reduce((sum, q) => sum + q.score, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, q) => sum + q.score, 0) / secondHalf.length;
      
      let trend: 'improving' | 'declining' | 'stable' = 'stable';
      if (secondHalfAvg > firstHalfAvg + 0.5) trend = 'improving';
      else if (secondHalfAvg < firstHalfAvg - 0.5) trend = 'declining';

      // Quality distribution
      const highQuality = qualityScores.filter(q => q.score >= 8).length;
      const mediumQuality = qualityScores.filter(q => q.score >= 6 && q.score < 8).length;
      const lowQuality = qualityScores.filter(q => q.score < 6).length;

      // Generate recommendations
      const recommendations = this.generateRecommendations(averageQuality, trend, {
        high_quality: highQuality,
        medium_quality: mediumQuality,
        low_quality: lowQuality
      });

      return {
        average_quality: Math.round(averageQuality * 100) / 100,
        total_interactions: interactions.length,
        quality_trend: trend,
        recommendations,
        metrics_breakdown: {
          high_quality: highQuality,
          medium_quality: mediumQuality,
          low_quality: lowQuality
        }
      };

    } catch (error) {
      logger.error('Quality report generation failed', { error });
      throw error;
    }
  }

  private parseQualityMetrics(response: string): QualityMetrics {
    try {
      // Try to parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          overall_score: parsed.overall_score || 7,
          relevance: parsed.relevance || 7,
          clarity: parsed.clarity || 7,
          empathy: parsed.empathy || 7,
          completeness: parsed.completeness || 7,
          professionalism: parsed.professionalism || 7,
          confidence: parsed.confidence || 0.7,
          strengths: parsed.strengths || [],
          improvements: parsed.improvements || []
        };
      }
    } catch (error) {
      logger.warn('Failed to parse quality metrics JSON', { error });
    }

    return this.getDefaultQualityMetrics();
  }

  private parseEscalationAnalysis(response: string): EscalationAnalysis {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          escalation_level: parsed.escalation_level || 'standard',
          confidence: parsed.confidence || 0.7,
          reasoning: parsed.reasoning || 'Standard customer service interaction',
          suggested_action: parsed.suggested_action || 'Continue with standard support',
          urgency: parsed.urgency || 'low',
          risk_factors: parsed.risk_factors || []
        };
      }
    } catch (error) {
      logger.warn('Failed to parse escalation analysis JSON', { error });
    }

    return this.getDefaultEscalationAnalysis();
  }

  private extractKeywords(text: string): string[] {
    const stopWords = new Set(['a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'will', 'with']);
    return text.split(/\W+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 10); // Limit to top 10 keywords
  }

  private generateRecommendations(
    averageQuality: number,
    trend: string,
    distribution: { high_quality: number; medium_quality: number; low_quality: number }
  ): string[] {
    const recommendations: string[] = [];

    if (averageQuality < 6) {
      recommendations.push('Focus on improving response relevance and completeness');
      recommendations.push('Provide additional training on empathetic communication');
    }

    if (trend === 'declining') {
      recommendations.push('Investigate recent changes that may be affecting response quality');
      recommendations.push('Consider refresher training for customer service representatives');
    }

    if (distribution.low_quality > distribution.high_quality) {
      recommendations.push('Implement quality review process for responses before sending');
      recommendations.push('Use AI suggestions more effectively to improve response quality');
    }

    if (averageQuality > 8) {
      recommendations.push('Maintain current high quality standards');
      recommendations.push('Consider using best practices as training examples');
    }

    return recommendations;
  }

  private getDefaultQualityMetrics(): QualityMetrics {
    return {
      overall_score: 7,
      relevance: 7,
      clarity: 7,
      empathy: 6,
      completeness: 7,
      professionalism: 8,
      confidence: 0.7,
      strengths: ['Professional tone maintained'],
      improvements: ['Could provide more specific details']
    };
  }

  private getDefaultEscalationAnalysis(): EscalationAnalysis {
    return {
      escalation_level: 'standard',
      confidence: 0.7,
      reasoning: 'Standard customer service interaction with no escalation indicators',
      suggested_action: 'Continue with standard support process',
      urgency: 'low',
      risk_factors: []
    };
  }
}

export default QualityAssessmentService;