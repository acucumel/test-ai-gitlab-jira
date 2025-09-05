const JiraApi = require('node-jira-client');
const shell = require('shelljs');
const fs = require('fs-extra');
const path = require('path');
const winston = require('winston');
require('dotenv').config();

// 📊 Configuration logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'logs/automation.log' })
  ]
});

class JiraClaudeAutomation {
  constructor() {
    this.jira = new JiraApi({
      protocol: 'https',
      host: process.env.JIRA_HOST,
      username: process.env.JIRA_USERNAME,
      password: process.env.JIRA_API_TOKEN,
      apiVersion: '2',
      strictSSL: true
    });
    
    this.workingDir = process.env.WORKING_DIR || '/workspace';
    this.projectKey = process.env.JIRA_PROJECT_KEY;
    this.targetLabels = process.env.TARGET_LABELS?.split(',') || ['claude-automation'];
  }

  async initialize() {
    await fs.ensureDir(this.workingDir);
    await fs.ensureDir('logs');
    
    if (!shell.which('claude-code')) {
      throw new Error('Claude Code CLI non installé');
    }
    
    logger.info('✅ Initialisation terminée');
  }

  async getTasksFromBacklog() {
    try {
      const jql = `project = "${this.projectKey}" AND status = "To Do" AND labels IN (${this.targetLabels.map(l => `"${l}"`).join(',')}) ORDER BY priority DESC, created ASC`;
      
      logger.info(`🔍 JQL: ${jql}`);
      
      const searchResults = await this.jira.searchJira(jql, {
        startAt: 0,
        maxResults: 10,
        fields: ['summary', 'description', 'priority', 'labels', 'assignee', 'key']
      });

      return searchResults.issues.map(issue => ({
        key: issue.key,
        summary: issue.fields.summary,
        description: issue.fields.description,
        priority: issue.fields.priority?.name,
        labels: issue.fields.labels?.map(l => l.name) || [],
        assignee: issue.fields.assignee?.displayName
      }));
    } catch (error) {
      logger.error('❌ Erreur récupération tâches:', error.message);
      throw error;
    }
  }

  async setupGitRepository(task) {
    const repoUrl = process.env.REPOSITORY_URL;
    const defaultBranch = process.env.DEFAULT_BRANCH || 'main';
    const taskDir = path.join(this.workingDir, task.key);
    
    await fs.ensureDir(taskDir);
    shell.cd(taskDir);
    
    logger.info(`🌿 Setup Git pour ${task.key}`);
    
    // Clone repository
    if (!fs.existsSync('.git')) {
      if (!repoUrl) {
        throw new Error('REPOSITORY_URL manquante');
      }
      
      const cloneResult = shell.exec(`git clone ${repoUrl} .`);
      if (cloneResult.code !== 0) {
        throw new Error(`Échec clone: ${cloneResult.stderr}`);
      }
    }
    
    // Configuration Git
    shell.exec('git config user.email "jira-automation@company.com"');
    shell.exec('git config user.name "Jira Claude Automation"');
    
    // Checkout et mise à jour
    shell.exec(`git checkout ${defaultBranch}`);
    shell.exec('git pull origin ' + defaultBranch);
    
    // Nouvelle branche
    const branchName = `feature/${task.key.toLowerCase()}-${task.summary.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50)}`;
    const branchResult = shell.exec(`git checkout -b ${branchName}`);
    
    if (branchResult.code !== 0) {
      logger.warn(`Branche existe, checkout ${branchName}`);
      shell.exec(`git checkout ${branchName}`);
    }
    
    return { taskDir, branchName, defaultBranch };
  }

  async runAutomatedTests(taskDir) {
    shell.cd(taskDir);
    logger.info('🧪 Tests automatisés...');
    
    // Tests Maven (Java)
    if (fs.existsSync('pom.xml')) {
      logger.info('☕ Tests Maven détectés...');
      // Vérifier si Maven est installé
      if (shell.which('mvn')) {
        const testResult = shell.exec('mvn test');
        return {
          success: testResult.code === 0,
          output: testResult.stdout,
          error: testResult.stderr,
          type: 'maven'
        };
      } else {
        logger.warn('⚠️  Maven non installé, tentative avec wrapper...');
        // Essayer avec Maven wrapper
        if (fs.existsSync('mvnw') || fs.existsSync('mvnw.cmd')) {
          const wrapper = process.platform === 'win32' ? 'mvnw.cmd' : './mvnw';
          const testResult = shell.exec(`${wrapper} test`);
          return {
            success: testResult.code === 0,
            output: testResult.stdout,
            error: testResult.stderr,
            type: 'maven-wrapper'
          };
        }
      }
    }
    
    // Tests Gradle (Java/Kotlin)
    if (fs.existsSync('build.gradle') || fs.existsSync('build.gradle.kts')) {
      logger.info('🐘 Tests Gradle détectés...');
      if (shell.which('gradle')) {
        const testResult = shell.exec('gradle test');
        return {
          success: testResult.code === 0,
          output: testResult.stdout,
          error: testResult.stderr,
          type: 'gradle'
        };
      } else if (fs.existsSync('gradlew') || fs.existsSync('gradlew.bat')) {
        const wrapper = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
        const testResult = shell.exec(`${wrapper} test`);
        return {
          success: testResult.code === 0,
          output: testResult.stdout,
          error: testResult.stderr,
          type: 'gradle-wrapper'
        };
      }
    }
    
    // Tests Node.js
    if (fs.existsSync('package.json')) {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      if (packageJson.scripts?.test) {
        logger.info('📦 Tests npm détectés...');
        const testResult = shell.exec('npm test');
        return {
          success: testResult.code === 0,
          output: testResult.stdout,
          error: testResult.stderr,
          type: 'npm'
        };
      }
    }
    
    // Tests Python
    if (fs.existsSync('requirements.txt') || fs.existsSync('pytest.ini') || fs.existsSync('tests/') || fs.existsSync('test/')) {
      logger.info('🐍 Tests Python détectés...');
      const testResult = shell.exec('python -m pytest -v --tb=short');
      return {
        success: testResult.code === 0,
        output: testResult.stdout,
        error: testResult.stderr,
        type: 'pytest'
      };
    }
    
    // Tests .NET
    if (fs.existsSync('*.sln') || shell.ls('*.csproj').length > 0) {
      logger.info('🔷 Tests .NET détectés...');
      const testResult = shell.exec('dotnet test');
      return {
        success: testResult.code === 0,
        output: testResult.stdout,
        error: testResult.stderr,
        type: 'dotnet'
      };
    }
    
    // Tests Go
    if (fs.existsSync('go.mod')) {
      logger.info('🐹 Tests Go détectés...');
      const testResult = shell.exec('go test ./...');
      return {
        success: testResult.code === 0,
        output: testResult.stdout,
        error: testResult.stderr,
        type: 'go'
      };
    }
    
    // Makefile avec target test
    if (fs.existsSync('Makefile')) {
      const makefileContent = fs.readFileSync('Makefile', 'utf8');
      if (makefileContent.includes('test:')) {
        logger.info('🔨 Tests Make détectés...');
        const testResult = shell.exec('make test');
        return {
          success: testResult.code === 0,
          output: testResult.stdout,
          error: testResult.stderr,
          type: 'make'
        };
      }
    }
    
    logger.info('⚠️  Aucun système de test automatisé détecté');
    return { 
      success: true, 
      output: 'Aucun test automatisé configuré - validation par défaut', 
      error: null,
      type: 'none'
    };
  }

  async createMergeRequest(task, branchName, defaultBranch, taskDir) {
    shell.cd(taskDir);
    
    // Commit et push
    shell.exec('git add .');
    const commitMessage = `feat(${task.key}): ${task.summary}\n\n${task.description || ''}`;
    shell.exec(`git commit -m "${commitMessage}"`);
    shell.exec(`git push origin ${branchName}`);
    
    // MR via API GitLab
    const gitlabToken = process.env.GITLAB_ACCESS_TOKEN;
    const projectId = process.env.GITLAB_PROJECT_ID;
    
    if (!gitlabToken || !projectId) {
      logger.warn('⚠️  Config GitLab manquante');
      return { success: false, message: 'Config GitLab manquante' };
    }
    
    const mergeRequestData = {
      source_branch: branchName,
      target_branch: defaultBranch,
      title: `[${task.key}] ${task.summary}`,
      description: `
## 🤖 Tâche automatisée par Claude Code

**Tâche Jira:** [${task.key}](https://${process.env.JIRA_HOST}/browse/${task.key})

### Description
${task.description || 'Aucune description fournie'}

### Priorité
${task.priority || 'Non définie'}

### Modifications réalisées
- Solution générée automatiquement par Claude Code
- Tests automatisés validés
- Code prêt pour review

### Checklist de review
- [ ] Code review complet
- [ ] Tests supplémentaires si nécessaire
- [ ] Documentation mise à jour
- [ ] Approbation fonctionnelle

**Note:** Cette MR a été créée automatiquement par l'intégration Jira-Claude.
      `,
      assignee_ids: task.assignee ? await this.getGitLabUserId(task.assignee) : undefined,
      labels: ['automation', 'claude-generated', task.priority?.toLowerCase()].filter(Boolean)
    };
    
    try {
      const axios = require('axios');
      const response = await axios.post(
        `https://gitlab.com/api/v4/projects/${projectId}/merge_requests`,
        mergeRequestData,
        {
          headers: {
            'Private-Token': gitlabToken,
            'Content-Type': 'application/json'
          }
        }
      );
      
      logger.info(`✅ MR créée: ${response.data.web_url}`);
      return {
        success: true,
        mergeRequestUrl: response.data.web_url,
        mergeRequestId: response.data.iid
      };
    } catch (error) {
      logger.error('❌ Erreur création MR:', error.message);
      return { success: false, error: error.message };
    }
  }

  async getGitLabUserId(displayName) {
    return null; // Implémentation simplifiée
  }

  prepareClaudePrompt(task, branchName) {
    return `
# Tâche Jira: ${task.key}

## Résumé
${task.summary}

## Description
${task.description || 'Aucune description fournie'}

## Priorité
${task.priority || 'Non définie'}

## Labels
${task.labels.join(', ')}

## Contexte Git
- **Branche**: ${branchName}
- **Repository**: ${process.env.REPOSITORY_URL || 'Repository local'}
- **Branche par défaut**: ${process.env.DEFAULT_BRANCH || 'main'}

## Instructions détaillées
Vous travaillez sur une tâche Jira dans un environnement Git configuré.

### 1. Analyse et compréhension
- Analysez le code existant dans le repository
- Identifiez les patterns et conventions utilisés
- Comprenez l'architecture du projet

### 2. Implémentation
Si c'est une tâche de développement :
- Créez/modifiez les fichiers nécessaires
- Respectez les conventions existantes
- Utilisez les mêmes technologies que le projet
- Ajoutez des tests unitaires appropriés
- Documentez avec des commentaires clairs
- Mettez à jour la documentation si nécessaire

### 3. Tests et validation
- Assurez-vous que tous les tests existants passent
- Ajoutez de nouveaux tests pour couvrir votre code
- Vérifiez compilation/exécution sans erreurs
- Validez le respect des standards de qualité

### 4. Technologies supportées
Le système supporte automatiquement :
- **Java** : Maven (mvn test) et Gradle (gradle test)
- **Node.js** : npm test
- **Python** : pytest
- **.NET** : dotnet test
- **Go** : go test ./...
- **Make** : make test

### 5. Bonnes pratiques
- Suivez les principes SOLID
- Gérez correctement les erreurs
- Optimisez les performances si nécessaire
- Assurez-vous de la sécurité du code
- Respectez les normes d'accessibilité si applicable

### 6. Livrables attendus
- Code fonctionnel et testé
- Tests automatisés qui passent
- Documentation mise à jour
- Commits avec messages clairs

## Contraintes techniques
- Code prêt pour la production
- Tests automatisés doivent passer
- Respectez l'architecture existante
- Suivez les guidelines du projet

## Note importante
Cette tâche sera automatiquement testée. Si les tests passent, une Merge Request sera créée et la tâche Jira passera en "Code Review".

Commencez par explorer le repository, puis implémentez étape par étape.
`;
  }

  async executeTaskWithClaude(task) {
    try {
      logger.info(`🚀 Exécution ${task.key}: ${task.summary}`);
      
      // 1. Setup Git
      const { taskDir, branchName, defaultBranch } = await this.setupGitRepository(task);
      
      // 2. Prompt Claude
      const prompt = this.prepareClaudePrompt(task, branchName);
      
      // 3. Sauvegarder prompt
      await fs.writeFile(path.join(taskDir, 'task-prompt.md'), prompt);
      
      // 4. Claude Code
      const result = shell.exec(`claude-code "${prompt}"`, {
        silent: false,
        cwd: taskDir
      });
      
      if (result.code !== 0) {
        throw new Error(`Claude Code échec: ${result.code}: ${result.stderr}`);
      }
      
      // 5. Sauvegarder résultats
      await fs.writeFile(path.join(taskDir, 'claude-output.txt'), result.stdout);
      
      // 6. Tests automatisés
      const testResults = await this.runAutomatedTests(taskDir);
      
      if (!testResults.success) {
        logger.error(`❌ Tests ${testResults.type} échoués`);
        return {
          success: false,
          error: `Tests ${testResults.type} échoués: ${testResults.error}`,
          testResults,
          taskDir,
          branchName
        };
      }
      
      logger.info(`✅ Tests ${testResults.type} passés`);
      
      // 7. Merge Request
      const mergeRequestResult = await this.createMergeRequest(task, branchName, defaultBranch, taskDir);
      
      return {
        success: true,
        output: result.stdout,
        taskDir,
        branchName,
        testResults,
        mergeRequest: mergeRequestResult
      };
      
    } catch (error) {
      logger.error(`❌ Erreur ${task.key}:`, error.message);
      return {
        success: false,
        error: error.message,
        taskDir: this.workingDir + '/' + task.key
      };
    }
  }

  async sendTeamsNotification(task, result) {
    const teamsWebhookUrl = process.env.TEAMS_WEBHOOK_URL;
    
    if (!teamsWebhookUrl) {
      logger.warn('⚠️  TEAMS_WEBHOOK_URL non configuré');
      return { success: false, message: 'Webhook URL manquant' };
    }
    
    try {
      const axios = require('axios');
      const card = this.buildTeamsCard(task, result);
      
      const response = await axios.post(teamsWebhookUrl, card, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      logger.info('✅ Notification Teams envoyée');
      return { success: true, response: response.status };
      
    } catch (error) {
      logger.error('❌ Erreur notification Teams:', error.message);
      return { success: false, error: error.message };
    }
  }

  buildTeamsCard(task, result) {
    const isSuccess = result.success && result.testResults?.success && result.mergeRequest?.success;
    const statusColor = isSuccess ? 'Good' : result.success ? 'Warning' : 'Attention';
    const statusIcon = isSuccess ? '✅' : result.success ? '⚠️' : '❌';
    const statusText = isSuccess ? 'Succès complet' : result.success ? 'Succès partiel' : 'Échec';
    
    const jiraUrl = `https://${process.env.JIRA_HOST}/browse/${task.key}`;
    const testType = result.testResults?.type || 'unknown';
    
    return {
      "@type": "MessageCard",
      "@context": "https://schema.org/extensions",
      "themeColor": statusColor === 'Good' ? '00FF00' : statusColor === 'Warning' ? 'FFA500' : 'FF0000',
      "summary": `Tâche automatisée: ${task.key}`,
      "sections": [
        {
          "activityTitle": `${statusIcon} **Automatisation Claude Code**`,
          "activitySubtitle": `Tâche ${task.key} - ${statusText}`,
          "facts": [
            {
              "name": "🎫 Tâche",
              "value": `[${task.key}](${jiraUrl}) - ${task.summary}`
            },
            {
              "name": "⚡ Priorité", 
              "value": task.priority || 'Non définie'
            },
            {
              "name": "👤 Assigné",
              "value": task.assignee || 'Non assigné'
            },
            {
              "name": "🌿 Branche",
              "value": result.branchName || 'N/A'
            },
            {
              "name": "🧪 Tests",
              "value": result.testResults?.success ? `✅ ${testType.toUpperCase()} passés` : `❌ ${testType.toUpperCase()} échoués`
            },
            {
              "name": "🔀 Merge Request",
              "value": result.mergeRequest?.success ? '✅ Créée' : '❌ Erreur'
            }
          ],
          "markdown": true
        }
      ],
      "potentialAction": this.buildTeamsActions(task, result, jiraUrl)
    };
  }

  buildTeamsActions(task, result, jiraUrl) {
    const actions = [
      {
        "@type": "OpenUri",
        "name": "📋 Voir la tâche Jira",
        "targets": [{ "os": "default", "uri": jiraUrl }]
      }
    ];

    if (result.mergeRequest?.success && result.mergeRequest.mergeRequestUrl) {
      actions.push({
        "@type": "OpenUri", 
        "name": "🔀 Voir la Merge Request",
        "targets": [{ "os": "default", "uri": result.mergeRequest.mergeRequestUrl }]
      });
    }

    if (process.env.CI_PIPELINE_URL) {
      actions.push({
        "@type": "OpenUri",
        "name": "📊 Voir les logs CI/CD", 
        "targets": [{ "os": "default", "uri": process.env.CI_PIPELINE_URL }]
      });
    }

    return actions;
  }

  async sendTeamsProgressNotification(task, status = 'started') {
    const teamsWebhookUrl = process.env.TEAMS_WEBHOOK_URL;
    if (!teamsWebhookUrl) return { success: false };
    
    try {
      const axios = require('axios');
      const jiraUrl = `https://${process.env.JIRA_HOST}/browse/${task.key}`;
      
      const card = {
        "@type": "MessageCard",
        "@context": "https://schema.org/extensions", 
        "themeColor": "0078D4",
        "summary": `Tâche ${task.key} ${status}`,
        "sections": [
          {
            "activityTitle": `🚀 **Automatisation en cours**`,
            "activitySubtitle": `Tâche ${task.key} - ${status === 'started' ? 'Démarrage' : 'En cours'}`,
            "facts": [
              {
                "name": "🎫 Tâche",
                "value": `[${task.key}](${jiraUrl}) - ${task.summary}`
              },
              {
                "name": "📅 Démarré à",
                "value": new Date().toLocaleString('fr-FR')
              },
              {
                "name": "🤖 Processus",
                "value": "Claude Code en action..."
              }
            ],
            "markdown": true
          }
        ]
      };
      
      await axios.post(teamsWebhookUrl, card);
      logger.info(`📢 Notification Teams: ${task.key} ${status}`);
      return { success: true };
      
    } catch (error) {
      logger.error('❌ Erreur notification progress:', error.message);
      return { success: false };
    }
  }

  async updateJiraTask(taskKey, result) {
    try {
      let comment, transition;
      const testType = result.testResults?.type || 'unknown';
      
      if (result.success) {
        comment = `✅ **Tâche automatisée avec succès par Claude Code**

📁 **Répertoire**: ${result.taskDir}
🌿 **Branche**: ${result.branchName}

## Tests automatisés (${testType.toUpperCase()})
${result.testResults.success ? '✅ Tous les tests passent' : '❌ Tests échoués'}
\`\`\`
${result.testResults.output || 'Aucun output de test'}
\`\`\`

## Merge Request
${result.mergeRequest.success 
  ? `✅ MR créée automatiquement: ${result.mergeRequest.mergeRequestUrl}`
  : `❌ Erreur création MR: ${result.mergeRequest.error || result.mergeRequest.message}`
}

**Prochaine étape**: Code Review requis avant merge.
        `;
        
        if (result.testResults.success && result.mergeRequest.success) {
          transition = await this.getJiraTransitionId(taskKey, 'Code Review');
        }
      } else {
        comment = `❌ **Erreur lors de l'automatisation**

**Erreur**: ${result.error}

${result.testResults ? `
## Tests automatisés (${testType.toUpperCase()})
${result.testResults.success ? '✅ Tests OK' : '❌ Tests échoués'}
\`\`\`
${result.testResults.error || result.testResults.output || 'Pas de détails'}
\`\`\`
` : ''}

${result.branchName ? `**Branche créée**: ${result.branchName}` : ''}

**Action requise**: Vérification manuelle nécessaire.
        `;
      }
      
      // Ajouter commentaire
      await this.jira.addComment(taskKey, comment);
      logger.info(`✅ Commentaire ajouté à ${taskKey}`);
      
      // Transition si applicable
      if (transition) {
        try {
          await this.jira.transitionIssue(taskKey, { 
            transition: { id: transition.id },
            fields: {
              assignee: { name: result.task?.assignee || null },
              customfield_10000: result.mergeRequest.mergeRequestUrl
            }
          });
          logger.info(`✅ ${taskKey} → "Code Review"`);
        } catch (transitionError) {
          logger.error(`❌ Erreur transition ${taskKey}:`, transitionError.message);
        }
      }
      
      // Notification Teams
      const teamsNotification = await this.sendTeamsNotification(
        { key: taskKey, ...result.task }, 
        result
      );
      
      if (teamsNotification.success) {
        logger.info('📢 Équipe notifiée via Teams');
      }
      
    } catch (error) {
      logger.error(`❌ Erreur mise à jour ${taskKey}:`, error.message);
    }
  }

  async getJiraTransitionId(taskKey, targetStatus) {
    try {
      const transitions = await this.jira.listTransitions(taskKey);
      const transition = transitions.transitions.find(t => 
        t.name.toLowerCase().includes(targetStatus.toLowerCase()) ||
        t.to.name.toLowerCase().includes(targetStatus.toLowerCase())
      );
      
      if (transition) {
        logger.info(`✅ Transition "${targetStatus}": ${transition.name} (${transition.id})`);
        return transition;
      } else {
        logger.warn(`⚠️  Transition "${targetStatus}" non trouvée pour ${taskKey}`);
        return null;
      }
    } catch (error) {
      logger.error(`❌ Erreur transitions ${taskKey}:`, error.message);
      return null;
    }
  }

  async run() {
    try {
      await this.initialize();
      
      const tasks = await this.getTasksFromBacklog();
      logger.info(`📋 ${tasks.length} tâche(s) trouvée(s)`);
      
      const results = [];
      
      for (const task of tasks) {
        // Notification démarrage
        await this.sendTeamsProgressNotification(task, 'started');
        
        const result = await this.executeTaskWithClaude(task);
        results.push({ task, result });
        
        // Mise à jour Jira (inclut notification Teams)
        await this.updateJiraTask(task.key, { ...result, task });
        
        // Pause entre tâches
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Résumé final
      const successful = results.filter(r => r.result.success).length;
      const failed = results.length - successful;
      
      logger.info(`🎯 Terminé: ${successful} réussie(s), ${failed} échouée(s)`);
      
      return results;
      
    } catch (error) {
      logger.error('❌ Erreur générale:', error.message);
      throw error;
    }
  }
}

// Exécution directe
if (require.main === module) {
  const automation = new JiraClaudeAutomation();
  automation.run().catch(error => {
    logger.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
}

module.exports = JiraClaudeAutomation;