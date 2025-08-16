export default function DebugApp() {
  console.log('DebugApp component is rendering')
  
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      color: '#111827',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <h1 style={{
        fontSize: '2rem',
        fontWeight: 'bold',
        marginBottom: '1rem',
        color: '#111827'
      }}>
        🚀 GenAI CRM Dashboard - Debug Mode
      </h1>
      
      <div style={{
        backgroundColor: '#ffffff',
        padding: '2rem',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        maxWidth: '600px',
        textAlign: 'center'
      }}>
        <h2 style={{ marginBottom: '1rem', color: '#059669' }}>✅ React is Loading Successfully!</h2>
        <p style={{ marginBottom: '1rem', color: '#4b5563' }}>
          This debug page confirms that:
        </p>
        <ul style={{ textAlign: 'left', marginBottom: '1.5rem', color: '#6b7280' }}>
          <li>✅ React is rendering properly</li>
          <li>✅ CSS styling is working</li>
          <li>✅ Fonts are loading (Inter)</li>
          <li>✅ Colors and layout are applied</li>
        </ul>
        
        <div style={{
          backgroundColor: '#fef3c7',
          padding: '1rem',
          borderRadius: '0.375rem',
          marginBottom: '1rem',
          borderLeft: '4px solid #f59e0b'
        }}>
          <p style={{ margin: 0, color: '#92400e' }}>
            <strong>Debug Mode Active:</strong> This page bypasses all complex routing and authentication.
          </p>
        </div>
        
        <p style={{ color: '#4b5563', fontSize: '0.875rem' }}>
          Current time: {new Date().toLocaleString()}
        </p>
      </div>
      
      <div style={{
        marginTop: '2rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        width: '100%',
        maxWidth: '600px'
      }}>
        <div style={{
          backgroundColor: '#dbeafe',
          padding: '1rem',
          borderRadius: '0.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e40af' }}>42</div>
          <div style={{ fontSize: '0.875rem', color: '#3730a3' }}>Sample Metric</div>
        </div>
        
        <div style={{
          backgroundColor: '#dcfce7',
          padding: '1rem',
          borderRadius: '0.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#166534' }}>98%</div>
          <div style={{ fontSize: '0.875rem', color: '#14532d' }}>Success Rate</div>
        </div>
        
        <div style={{
          backgroundColor: '#fef3c7',
          padding: '1rem',
          borderRadius: '0.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#92400e' }}>Debug</div>
          <div style={{ fontSize: '0.875rem', color: '#a16207' }}>Mode Active</div>
        </div>
      </div>
    </div>
  )
}