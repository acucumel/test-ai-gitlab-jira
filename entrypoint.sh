#!/bin/bash
set -e

echo "🚀 Démarrage automatisation Jira-Claude"

# Variables essentielles
required_vars=(
    "JIRA_HOST"
    "JIRA_USERNAME" 
    "JIRA_API_TOKEN"
    "JIRA_PROJECT_KEY"
    "REPOSITORY_URL"
    "GITLAB_ACCESS_TOKEN"
    "GITLAB_PROJECT_ID"
)

# Validation variables
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Variable manquante: $var"
        exit 1
    fi
done

echo "✅ Variables validées"

# Configuration Git
if [ ! -d ".git" ]; then
    git config --global user.email "jira-automation@company.com"
    git config --global user.name "Jira Claude Automation"
    git config --global init.defaultBranch main
    git init
fi

echo "✅ Git configuré"

# Test outils de build
echo "🔧 Vérification outils de build..."

# Vérifier Java et Maven
if command -v java &> /dev/null; then
    echo "☕ Java $(java -version 2>&1 | head -1 | cut -d'"' -f2) disponible"
fi

if command -v mvn &> /dev/null; then
    echo "🔨 Maven $(mvn -version | head -1 | cut -d' ' -f3) disponible"
fi

# Vérifier Python
if command -v python3 &> /dev/null; then
    echo "🐍 Python $(python3 --version | cut -d' ' -f2) disponible"
fi

# Test Jira
echo "🔗 Test connexion Jira..."
if curl -s -u "$JIRA_USERNAME:$JIRA_API_TOKEN" \
   "https://$JIRA_HOST/rest/api/2/myself" > /dev/null; then
    echo "✅ Jira connecté"
else
    echo "❌ Erreur connexion Jira"
    exit 1
fi

# Configuration Claude Code
echo "🤖 Configuration Claude Code..."
if [ -f "/app/scripts/setup-claude-auth.sh" ]; then
    chmod +x /app/scripts/setup-claude-auth.sh
    /app/scripts/setup-claude-auth.sh
else
    echo "⚠️  Script auth non trouvé"
fi

# Lancement
echo "🎯 Lancement automatisation..."
exec npm start