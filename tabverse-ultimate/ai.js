// TabVerse Ultimate - AI Assistant Module

export class AIAssistant {
  constructor() {
    this.settings = {
      enabled: true,
      useAPI: false,
      apiKey: '',
      promptStyle: 'concise'
    };
    this.listenersSetup = false;
  }

  async init() {
    await this.loadSettings();
    if (!this.listenersSetup) {
      this.setupListeners();
      this.listenersSetup = true;
    }
    return true;
  }

  async loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['aiSettings'], (result) => {
        if (result.aiSettings) {
          this.settings = { ...this.settings, ...result.aiSettings };
        }
        resolve();
      });
    });
  }

  setupListeners() {
    window.addEventListener('tabverse-ai-request', async (e) => {
      const { message, pageText } = e.detail;
      const response = await this.processRequest(message, pageText);
      
      const responseEvent = new CustomEvent('tabverse-ai-response', {
        detail: { response }
      });
      window.dispatchEvent(responseEvent);
    });
  }

  async processRequest(message, pageText) {
    if (!this.settings.enabled) {
      return 'AI Assistant is disabled. Enable it in settings.';
    }

    if (this.settings.useAPI && this.settings.apiKey) {
      return await this.processWithAPI(message, pageText);
    } else {
      return this.processLocally(message, pageText);
    }
  }

  async processWithAPI(message, pageText) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.settings.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt()
            },
            {
              role: 'user',
              content: `Page content:\n${pageText.substring(0, 3000)}\n\nUser question: ${message}`
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'No response from API';
    } catch (error) {
      console.error('AI API error:', error);
      return 'Failed to connect to AI API. Check your API key in settings.';
    }
  }

  processLocally(message, pageText) {
    const lowerMessage = message.toLowerCase();
    
    // Summarize page
    if (lowerMessage.includes('summarize') || lowerMessage.includes('summary')) {
      return this.summarizePage(pageText);
    }
    
    // Extract key points
    if (lowerMessage.includes('key points') || lowerMessage.includes('main points')) {
      return this.extractKeyPoints(pageText);
    }
    
    // Count words
    if (lowerMessage.includes('word count') || lowerMessage.includes('how many words')) {
      const wordCount = pageText.split(/\s+/).length;
      return `This page contains approximately ${wordCount.toLocaleString()} words.`;
    }
    
    // Count links
    if (lowerMessage.includes('links') || lowerMessage.includes('how many links')) {
      const linkCount = document.querySelectorAll('a').length;
      return `This page has ${linkCount} links.`;
    }
    
    // Extract headings
    if (lowerMessage.includes('headings') || lowerMessage.includes('sections')) {
      return this.extractHeadings();
    }
    
    // Generic response
    return this.generateGenericResponse(message, pageText);
  }

  summarizePage(pageText) {
    // Simple keyword-based summarization
    const words = pageText.toLowerCase().split(/\s+/);
    const sentences = pageText.match(/[^.!?]+[.!?]+/g) || [];
    
    // Get word frequency
    const wordFreq = {};
    words.forEach(word => {
      if (word.length > 4) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
    
    // Get top keywords
    const topKeywords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
    
    // Find sentences with most keywords
    const scoredSentences = sentences.map(sentence => {
      const lowerSentence = sentence.toLowerCase();
      const score = topKeywords.reduce((sum, keyword) => {
        return sum + (lowerSentence.includes(keyword) ? 1 : 0);
      }, 0);
      return { sentence: sentence.trim(), score };
    });
    
    // Get top 3 sentences
    const topSentences = scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(s => s.sentence);
    
    if (topSentences.length === 0) {
      return 'This page appears to have minimal text content.';
    }
    
    return `Summary: ${topSentences.join(' ')}`;
  }

  extractKeyPoints(pageText) {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
      .map(h => h.textContent.trim())
      .filter(text => text.length > 0)
      .slice(0, 5);
    
    if (headings.length === 0) {
      return 'No clear headings found on this page.';
    }
    
    return 'Key points:\n' + headings.map((h, i) => `${i + 1}. ${h}`).join('\n');
  }

  extractHeadings() {
    const headings = {};
    ['h1', 'h2', 'h3'].forEach(tag => {
      const elements = Array.from(document.querySelectorAll(tag));
      if (elements.length > 0) {
        headings[tag] = elements.map(el => el.textContent.trim()).slice(0, 5);
      }
    });
    
    if (Object.keys(headings).length === 0) {
      return 'No headings found on this page.';
    }
    
    let result = 'Page structure:\n';
    Object.entries(headings).forEach(([tag, texts]) => {
      result += `\n${tag.toUpperCase()}:\n`;
      texts.forEach(text => {
        result += `- ${text}\n`;
      });
    });
    
    return result;
  }

  generateGenericResponse(message, pageText) {
    const responses = [
      `I analyzed your question about "${message}". For more advanced AI responses, consider upgrading to Premium and connecting your OpenAI API key in settings.`,
      'I can help with basic page analysis locally. For detailed answers, enable the AI API in settings.',
      `Based on this page's content, I'd need more context. Try asking me to "summarize this page" or "extract key points".`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  getSystemPrompt() {
    const styles = {
      concise: 'You are a helpful assistant. Provide concise, clear answers.',
      detailed: 'You are a helpful assistant. Provide detailed, thorough explanations.',
      casual: 'You are a friendly assistant. Use a casual, conversational tone.',
      professional: 'You are a professional assistant. Use formal, precise language.'
    };
    
    return styles[this.settings.promptStyle] || styles.concise;
  }
}

// Export for module import - instance created by content.js
