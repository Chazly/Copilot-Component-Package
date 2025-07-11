# Copilot Package Testing Environment

This is a comprehensive testing environment for the Copilot Package components. It provides a localhost interface to test all features before deploying to production.

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Development Server**
   ```bash
   npm run test:dev
   ```

3. **Open your browser to**
   ```
   http://localhost:3005
   ```

## Available Tests

### 🧪 Dashboard
- Overview of all components
- Quick test examples
- Component statistics

### 🤖 Copilot Chat
- Test all 9 color themes
- Different response modes (normal, slow, error)
- Layout variations
- Theme consistency testing

### 📐 Resizable Layout
- Interactive panel resizing
- Configuration testing
- Content type variations
- Constraint testing

### 🏢 Enterprise Features
- Security monitoring dashboard
- Performance metrics
- Memory management
- Real-time updates

### ⚙️ Configuration
- Legacy vs AI config formats
- Configuration validation
- Live preview updates

### ⚡ Performance
- Render time monitoring
- Response time tracking
- Stress testing

## Test Scenarios

### Basic Testing
1. Send messages in different themes
2. Test resizable layout dragging
3. Check error handling
4. Verify loading states

### Advanced Testing
1. Enterprise security features
2. Performance monitoring
3. Memory scope management
4. Configuration validation

### Edge Cases
1. Very long messages
2. Rapid message sending
3. Error conditions
4. Slow responses

## Development

The testing environment is built with:
- **Vite** - Fast development server
- **React 18** - Component testing
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

## Building for Production

```bash
npm run test:build
npm run test:preview
```

## Configuration

The test environment includes:
- Mock data and responses
- Simulated enterprise features
- Real-time metric updates
- Comprehensive test scenarios

All configurations can be modified in `src/utils/mockData.ts`. 