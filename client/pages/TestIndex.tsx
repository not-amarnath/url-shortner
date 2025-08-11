export default function TestIndex() {
  console.log("TestIndex component rendering...");
  
  return (
    <div style={{ padding: '20px', fontSize: '18px' }}>
      <h1>URL Shortener Test</h1>
      <p>If you can see this, React is working!</p>
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '20px',
        borderRadius: '10px',
        marginTop: '20px'
      }}>
        <h2>URL Shortener</h2>
        <input 
          type="text" 
          placeholder="Enter URL to shorten..."
          style={{ 
            width: '300px', 
            padding: '10px', 
            marginRight: '10px',
            borderRadius: '5px',
            border: 'none'
          }}
        />
        <button 
          style={{
            padding: '10px 20px',
            background: '#fff',
            color: '#667eea',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Shorten
        </button>
      </div>
    </div>
  );
}
