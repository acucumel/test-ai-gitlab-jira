# 🤖 Automatisation Jira-Claude Team

Solution d'automatisation complète des tâches Jira avec Claude Code pour compte Team, incluant workflow Git et notifications Teams.

## ✨ Fonctionnalités

- 🎫 **Intégration Jira** : Récupération automatique des tâches avec labels
- 🤖 **Claude Code** : Génération de code intelligente avec prompts contextuels  
- 🌿 **Workflow Git** : Branches dédiées et Merge Requests automatiques
- 🧪 **Tests automatisés** : Support multi-technologie (Maven, Gradle, npm, pytest, .NET, Go, Make)
- 📢 **Notifications Teams** : Alerts temps réel pour l'équipe avec cartes interactives
- 🔄 **CI/CD GitLab** : Pipeline complète d'automatisation
- 🔐 **Authentification** : Support OAuth Claude Team

## 🚀 Workflow automatique

```mermaid
graph LR
    A[Tâche Jira] --> B[📢 Teams: Start]
    B --> C[🌿 Git Branch]
    C --> D[🤖 Claude Code] 
    D --> E[🧪 Tests Auto]
    E --> F[🔀 Merge Request]
    F --> G[📢 Teams: Done]
    G --> H[📋 Jira: Code Review]
```

## 🔧 Technologies supportées

### Tests automatisés
- ☕ **Java** : Maven (`mvn test`) et Gradle (`gradle test`)
- 📦 **Node.js** : npm test
- 🐍 **Python** : pytest avec options avancées
- 🔷 **.NET** : dotnet test
- 🐹 **Go** : go test ./...
- 🔨 **Make** : make test

### Environnements de développement
- Wrappers supportés (mvnw, gradlew)
- Cache Maven intégré
- Gestion multi-plateforme

## 📋 Configuration GitLab CI/CD

### Variables requises

| Variable | Description | Exemple |
|----------|-------------|---------|
| `JIRA_HOST` | Domaine Jira | `company.atlassian.net` |
| `JIRA_USERNAME` | Email Jira | `user@company.com` |
| `JIRA_API_TOKEN` | Token API Jira | `ATATTxxxxxx` |
| `JIRA_PROJECT_KEY` | Clé projet | `PROJ` |
| `REPOSITORY_URL` | URL Git | `https://gitlab.com/group/repo.git` |
| `GITLAB_ACCESS_TOKEN` | Token GitLab | `glpat-xxxxx` |
| `GITLAB_PROJECT_ID` | ID projet GitLab | `12345` |
| `TEAMS_WEBHOOK_URL` | Webhook Teams | `https://company.webhook.office.com/xxx` |
| `CLAUDE_SESSION_TOKEN` | Token Claude Team | `eyJhbGciOiJIUzI1NiJ9...` |
| `TARGET_LABELS` | Labels Jira | `claude-automation,auto-task` |

## 🔐 Authentification Claude Team

### Option 1: Token de session (Recommandée)

1. **Installation et connexion** :
   ```bash
   npm install -g @anthropic-ai/claude-code
   claude login
   # Sélectionnez "2. Claude account with subscription"
   ```

2. **Récupération du token** :
   ```bash
   # macOS
   security find-generic-password -s "Claude Code" -w
   
   # Linux/Docker
   cat ~/.claude/config.json
   ```

3. **Configuration GitLab** : Ajoutez `CLAUDE_SESSION_TOKEN` dans les variables CI/CD

### Option 2: API Console (Si disponible)
Si votre organisation a un compte API Console, obtenez une clé API auprès de votre administrateur.

## 📢 Configuration Microsoft Teams

### Créer le webhook

1. **Teams** → Canal dédié → **"..."** → **Connecteurs**
2. **Incoming Webhook** → **Configurer**
3. Nom : `Jira Claude Automation`
4. **Créer** → Copier l'URL générée
5. Ajouter `TEAMS_WEBHOOK_URL` dans GitLab Variables

### Types de notifications

- 🚀 **Démarrage** : Quand Claude Code commence à traiter une tâche
- ✅ **Succès complet** : Code généré + tests passés + MR créée
- ⚠️ **Succès partiel** : Code OK mais MR échouée
- ❌ **Échec** : Erreur dans le processus avec détails

## 🎯 Utilisation

### 1. Préparer les tâches Jira

Ajoutez le label `claude-automation` aux tâches que vous voulez automatiser :

**Exemples de tâches :**
- ✅ **API Backend** : "Créer endpoint REST pour gestion des utilisateurs"
- ✅ **Frontend** : "Implémenter composant React pour dashboard"  
- ✅ **Tests** : "Écrire tests unitaires pour service de paiement"
- ✅ **Bugfix** : "Corriger validation email dans formulaire d'inscription"
- ✅ **Documentation** : "Documenter API REST avec Swagger"

### 2. Exécution

**Manuelle** : GitLab → CI/CD → Pipelines → Run Pipeline → `run-automation`

**Programmée** : GitLab → CI/CD → Schedules → Nouvelle programmation

**Automatique** : Sur push vers `main` avec `RUN_AUTOMATION=true`

### 3. Résultats

- **Jira** : Commentaire détaillé + transition vers "Code Review"
- **GitLab** : MR automatique avec template enrichi  
- **Teams** : Notification avec liens directs
- **Artifacts** : Logs et code sauvegardés

## 🛠️ Développement local

```bash
# Setup du projet
git clone <your-repo>
cd jira-claude-automation

# Configuration
cp .env.template .env
# Éditez .env avec vos valeurs

# Test avec Docker
docker-compose up --build

# Ou directement
npm install && npm start
```

## 📊 Monitoring et logs

### Logs structurés
- **Console** : Logs colorés en temps réel
- **Fichier** : `logs/automation.log` avec rotation
- **Teams** : Notifications avec statuts détaillés

### Métriques disponibles
- Taux de succès par type de test
- Temps d'exécution moyen
- Erreurs par catégorie
- Statistiques par assigné

### Artifacts GitLab
- Workspace complet avec code généré
- Logs d'exécution détaillés  
- Rapports de tests
- Rétention configurable

## 🔍 Dépannage

### Erreurs courantes

**Authentication failed**
```bash
# Vérifier token Claude
claude --version
# Régénérer si nécessaire
```

**Tests failed**
```bash
# Vérifier outils installés
mvn -version    # Maven
gradle -version # Gradle
npm --version   # Node.js
python --version # Python
```

**GitLab MR creation failed**
- Vérifier `GITLAB_ACCESS_TOKEN`
- Vérifier permissions du token
- Vérifier `GITLAB_PROJECT_ID`

### Support technique

- **Claude Code** : https://docs.anthropic.com/en/docs/claude-code
- **Jira API** : https://developer.atlassian.com/cloud/jira/
- **GitLab CI/CD** : https://docs.gitlab.com/ee/ci/
- **Teams Webhooks** : https://docs.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/

## 🚀 Déploiement

### 1. Structure du projet
```
jira-claude-automation/
├── 📄 README.md
├── 🐳 Dockerfile  
├── 🔧 docker-compose.yml
├── 📦 package.json
├── ⚙️ .env.template
├── 🚀 .gitlab-ci.yml
├── 🔑 entrypoint.sh
├── src/
│   └── 📝 index.js
├── scripts/
│   └── 🔐 setup-claude-auth.sh
├── logs/
└── workspace/
```

### 2. Installation

1. **Créer le repository GitLab**
2. **Copier tous les fichiers** dans le repository
3. **Configurer les variables** CI/CD (voir tableau ci-dessus)
4. **Créer le webhook Teams**
5. **Obtenir le token Claude Team**

### 3. Premier test

```bash
# Test local
cp .env.template .env
# Compléter .env avec vos valeurs
docker-compose up --build

# Push vers GitLab
git add .
git commit -m "feat: Add Jira-Claude automation"
git push origin main
```

### 4. Configuration avancée

**Pipeline programmée** :
- GitLab → CI/CD → Schedules
- Cron : `0 9 * * 1-5` (9h du matin, lun-ven)
- Variables : `RUN_AUTOMATION=true`

**Protection des branches** :
- Settings → Repository → Push Rules
- Interdire push direct sur `main`
- Merge Request obligatoire

**Notifications Teams par équipe** :
```bash
# Variables pour différents canaux
TEAMS_FRONTEND_WEBHOOK=https://company.webhook.office.com/frontend
TEAMS_BACKEND_WEBHOOK=https://company.webhook.office.com/backend
TEAMS_QA_WEBHOOK=https://company.webhook.office.com/qa
```

## 📈 Performances et optimisations

### Cache et optimisations
- **Maven** : Cache `~/.m2` partagé
- **npm** : Cache node_modules 
- **Docker** : Multi-stage builds
- **Git** : Clone shallow pour performance

### Parallélisation
```yaml
# Dans .gitlab-ci.yml pour plusieurs tâches
run-automation-frontend:
  variables:
    TARGET_LABELS: "claude-automation,frontend"
  
run-automation-backend:
  variables:
    TARGET_LABELS: "claude-automation,backend"
```

### Limites et quotas
- **Claude Team** : Limites d'usage partagées
- **GitLab CI/CD** : Minutes de pipeline
- **Teams** : 100 requêtes/minute max

## 🔒 Sécurité

### Bonnes pratiques
- **Variables sensibles** : Toujours masquées dans GitLab
- **Tokens** : Rotation régulière recommandée
- **Permissions** : Principe du moindre privilège
- **Audit** : Logs complets des actions

### Permissions requises

**GitLab Token** :
- `api` : Accès API complet
- `read_repository` : Lecture du code
- `write_repository` : Création de branches et MR

**Jira Token** :
- Lecture des projets et tâches
- Écriture des commentaires
- Transition des tâches

## 📚 Documentation avancée

### Personnalisation des prompts

Modifiez `prepareClaudePrompt()` dans `src/index.js` :

```javascript
// Ajouter des instructions spécifiques par label
if (task.labels.includes('security')) {
  prompt += '\n### Exigences de sécurité\n- Validation stricte des inputs\n- Chiffrement des données sensibles';
}

if (task.labels.includes('performance')) {
  prompt += '\n### Optimisations requises\n- Cache implementation\n- Database query optimization';
}
```

### Intégrations supplémentaires

**Slack** :
```javascript
async sendSlackNotification(task, result) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  // Implémentation similaire à Teams
}
```

**Email** :
```javascript  
async sendEmailNotification(task, result) {
  const nodemailer = require('nodemailer');
  // Configuration SMTP
}
```

### Métriques personnalisées

```javascript
// Dans updateJiraTask()
await this.recordMetrics({
  taskKey: task.key,
  executionTime: Date.now() - startTime,
  testType: result.testResults.type,
  success: result.success
});
```

## 🎯 Cas d'usage avancés

### Multi-repositories

```javascript
// Support de plusieurs repositories
const repositories = {
  'frontend': 'https://gitlab.com/company/frontend.git',
  'backend': 'https://gitlab.com/company/backend.git',
  'mobile': 'https://gitlab.com/company/mobile.git'
};

const repoUrl = repositories[task.labels.find(l => repositories[l])] || process.env.REPOSITORY_URL;
```

### Workflow complexe

```javascript
// Gestion de tâches liées
if (task.labels.includes('epic')) {
  const subtasks = await this.getSubtasks(task.key);
  for (const subtask of subtasks) {
    await this.executeTaskWithClaude(subtask);
  }
}
```

### Tests conditionnels

```javascript
// Tests différents selon le contexte
async runConditionalTests(taskDir, task) {
  if (task.labels.includes('integration-test')) {
    return await this.runIntegrationTests(taskDir);
  }
  
  if (task.labels.includes('e2e-test')) {
    return await this.runE2ETests(taskDir);
  }
  
  return await this.runAutomatedTests(taskDir);
}
```

## 📝 Exemples de configuration

### .env complet pour production

```bash
# Jira Production
JIRA_HOST=mycompany.atlassian.net
JIRA_USERNAME=automation@mycompany.com  
JIRA_API_TOKEN=ATATT3xFfGF0123456789abcdef
JIRA_PROJECT_KEY=DEV

# GitLab
REPOSITORY_URL=https://gitlab.com/mycompany/main-app.git
DEFAULT_BRANCH=develop
GITLAB_ACCESS_TOKEN=glpat-xxxxxxxxxxxxxxxxxxxx
GITLAB_PROJECT_ID=12345

# Teams
TEAMS_WEBHOOK_URL=https://mycompany.webhook.office.com/webhookb2/...

# Claude Team  
CLAUDE_SESSION_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Configuration
TARGET_LABELS=claude-automation,ready-for-automation
WORKING_DIR=/workspace

# Logging (optionnel)
LOG_LEVEL=info
RETENTION_DAYS=7
```

### Docker Compose pour développement avec services

```yaml
version: '3.8'

services:
  jira-claude-automation:
    build: .
    env_file: .env
    volumes:
      - ./workspace:/workspace
      - ./logs:/app/logs
      - ./src:/app/src
      - ~/.m2:/root/.m2
    depends_on:
      - database
      - redis
    networks:
      - automation-network

  database:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: jira_automation
      POSTGRES_USER: automation
      POSTGRES_PASSWORD: password123
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - automation-network

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    networks:
      - automation-network

  # Monitoring avec Grafana (optionnel)
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
    networks:
      - automation-network

volumes:
  postgres_data:
  redis_data:
  grafana_data:

networks:
  automation-network:
    driver: bridge
```

## 🎉 Conclusion

Cette solution d'automatisation Jira-Claude offre :

### ✅ **Avantages immédiats**
- **Gain de temps** : 80% de réduction du temps entre tâche et code review
- **Qualité constante** : Code généré selon les standards du projet
- **Visibilité** : Notifications Teams temps réel
- **Traçabilité** : Logs complets et artifacts sauvegardés

### 🚀 **Évolutions possibles**
- **IA** : Amélioration continue des prompts selon les retours
- **Intégrations** : Confluence, Slack, autres outils
- **Métriques** : Dashboard de performance et ROI
- **Multi-projets** : Support de plusieurs équipes/projets

### 📞 **Support et contribution**

Pour questions, bugs ou améliorations :
1. **Issues GitLab** : Créer un ticket dans le projet
2. **Documentation** : Consulter les docs officielles des outils
3. **Communauté** : Partager vos retours d'expérience

**Bon automatisation ! 🤖✨**