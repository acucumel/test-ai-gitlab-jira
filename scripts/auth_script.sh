#!/bin/bash
set -e

echo "🔐 Configuration authentification Claude Team..."

# Option 1: Token de session Claude Team
if [ ! -z "$CLAUDE_SESSION_TOKEN" ]; then
    echo "📝 Configuration avec token de session..."
    
    mkdir -p ~/.claude
    
    cat > ~/.claude/config.json << EOF
{
    "auth": {
        "type": "session_token",
        "token": "$CLAUDE_SESSION_TOKEN"
    }
}
EOF
    
    echo "✅ Token de session configuré"
    exit 0
fi

# Option 2: API Console (si disponible)
if [ ! -z "$ANTHROPIC_API_KEY" ]; then
    echo "📝 Configuration avec clé API Console..."
    
    claude logout || true
    
    mkdir -p ~/.claude
    cat > ~/.claude/config.json << EOF
{
    "auth": {
        "type": "api_key",
        "key": "$ANTHROPIC_API_KEY"
    }
}
EOF
    
    echo "✅ Clé API configurée"
    exit 0
fi

# Option 3: Instructions manuelles
echo "⚠️  Configuration manuelle requise"
echo ""
echo "Pour authentification Team en CI/CD :"
echo ""
echo "1. 🏠 Sur votre machine locale :"
echo "   - claude login"
echo "   - Sélectionnez 'Claude account with subscription'"
echo "   - Autorisez votre organisation Team"
echo ""
echo "2. 🔧 Dans GitLab Variables :"
echo "   - Ajoutez CLAUDE_SESSION_TOKEN"
echo ""
echo "3. 🔄 Relancez la pipeline"

# Vérifier Claude Code
if command -v claude &> /dev/null; then
    echo "📋 Status Claude Code :"
    claude --version || true
    
    echo "🔍 Test authentification..."
    timeout 10s claude -p "echo 'Test auth'" || echo "❌ Auth requise"
else
    echo "❌ Claude Code CLI non trouvé"
    exit 1
fi

exit 1