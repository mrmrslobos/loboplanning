import { registerRootComponent } from 'expo';

// Use the simple app first to test that Metro is working
let App;
try {
  App = require('./SimpleApp').default;
} catch (error) {
  console.error('Error loading SimpleApp:', error);
  // Fallback simple component
  const React = require('react');
  const { View, Text } = require('react-native');
  
  App = function FallbackApp() {
    return React.createElement(View, { 
      style: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' } 
    }, React.createElement(Text, { style: { fontSize: 18, color: '#374151' } }, 'LoboHub Mobile - Loading...'));
  };
}

// Register the main component
registerRootComponent(App);