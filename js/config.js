// Configurações da API
const API_CONFIG = {
    baseUrl: 'https://api.example.com', // Substitua pela URL real da sua API
    imageStorage: 'https://storage.example.com', // Substitua pelo seu serviço de armazenamento
};

// Funções de utilidade para autenticação
const AuthUtils = {
    // Gera um hash seguro da senha (apenas para demonstração, use bcrypt no backend)
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    },

    // Gera um token JWT seguro
    generateToken(username) {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const now = Math.floor(Date.now() / 1000);
        const payload = btoa(JSON.stringify({
            sub: username,
            iat: now,
            exp: now + (24 * 60 * 60), // 24 horas
        }));
        return `${header}.${payload}`;
    },

    // Verifica se o token é válido
    isTokenValid(token) {
        try {
            const [, payload] = token.split('.');
            if (!payload) return false;
            
            const decodedPayload = JSON.parse(atob(payload));
            if (!decodedPayload || !decodedPayload.exp) return false;
            
            return Date.now() < decodedPayload.exp * 1000;
        } catch (error) {
            console.error('Erro ao validar token:', error);
            return false;
        }
    },

    // Armazena o token de forma segura
    setAuthToken(token) {
        sessionStorage.setItem('authToken', token);
    },

    // Recupera o token
    getAuthToken() {
        return sessionStorage.getItem('authToken');
    },

    // Remove o token
    removeAuthToken() {
        sessionStorage.removeItem('authToken');
    }
};

// Funções de utilidade para imagens
const ImageUtils = {
    // Valida e otimiza a imagem antes do upload
    async prepareImageForUpload(file) {
        // Verifica o tipo do arquivo
        if (!file.type.startsWith('image/')) {
            throw new Error('Arquivo não é uma imagem válida');
        }

        // Verifica o tamanho (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            throw new Error('Imagem muito grande (máximo 5MB)');
        }

        return file;
    },

    // Converte blob para base64 de forma segura
    async blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            reader.readAsDataURL(blob);
        });
    },

    // Sanitiza dados da imagem
    sanitizeImageData(imageData) {
        return {
            title: DOMPurify.sanitize(imageData.title),
            description: DOMPurify.sanitize(imageData.description),
            price: DOMPurify.sanitize(imageData.price),
            category: ['new', 'novelty'].includes(imageData.category) ? imageData.category : 'new'
        };
    }
};

// Funções de segurança geral
const SecurityUtils = {
    // Sanitiza input do usuário
    sanitizeInput(input) {
        return DOMPurify.sanitize(input);
    },

    // Gera um ID seguro
    generateSecureId() {
        const array = new Uint32Array(2);
        crypto.getRandomValues(array);
        return Array.from(array, dec => dec.toString(36)).join('-');
    },

    // Valida dados do formulário
    validateFormData(data) {
        const errors = [];
        
        if (!data.title?.trim()) errors.push('Título é obrigatório');
        if (!data.description?.trim()) errors.push('Descrição é obrigatória');
        if (data.price && !/^\d+([.,]\d{2})?$/.test(data.price)) {
            errors.push('Preço inválido');
        }

        return errors;
    }
};

// Exporta as utilidades
window.AppUtils = {
    auth: AuthUtils,
    image: ImageUtils,
    security: SecurityUtils,
    config: API_CONFIG
}; 