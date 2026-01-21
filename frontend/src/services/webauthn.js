/**
 * Servicio para manejar autenticación biométrica usando WebAuthn API
 * Permite usar el lector de huellas del teléfono móvil
 */

class WebAuthnService {
  /**
   * Verifica si WebAuthn está disponible en el navegador
   */
  isAvailable() {
    // Verificar que las APIs básicas existan
    const hasPublicKeyCredential = typeof window.PublicKeyCredential !== 'undefined';
    const hasCredentials = typeof navigator !== 'undefined' && 
                          typeof navigator.credentials !== 'undefined' &&
                          typeof navigator.credentials.create !== 'undefined';
    
    // Verificar contexto seguro (HTTPS o localhost)
    const isSecureContext = window.isSecureContext || 
                           window.location.protocol === 'https:' ||
                           window.location.hostname === 'localhost' ||
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname.endsWith('.localhost');
    
    return hasPublicKeyCredential && hasCredentials && isSecureContext;
  }

  /**
   * Verifica si hay autenticadores disponibles (más preciso)
   */
  async checkAuthenticatorAvailability() {
    if (!this.isAvailable()) {
      return {
        available: false,
        reason: 'WebAuthn no está disponible. Asegúrate de usar HTTPS o localhost.'
      };
    }

    try {
      // Intentar verificar si hay autenticadores disponibles
      // eslint-disable-next-line no-undef
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return {
        available: available,
        reason: available 
          ? 'Lector de huellas disponible' 
          : 'No se detectó un lector de huellas en este dispositivo'
      };
    } catch (error) {
      // Si falla la verificación, aún podemos intentar (algunos navegadores no soportan esta API)
      console.warn('No se pudo verificar disponibilidad de autenticador:', error);
      return {
        available: true, // Permitir intentar de todos modos
        reason: 'No se pudo verificar, pero se intentará usar WebAuthn'
      };
    }
  }

  /**
   * Convierte un string base64 a ArrayBuffer
   */
  base64ToArrayBuffer(base64) {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Convierte un ArrayBuffer a string base64
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * Convierte un string base64url a ArrayBuffer
   */
  base64UrlToArrayBuffer(base64url) {
    // Convertir base64url a base64
    let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    // Agregar padding si es necesario
    while (base64.length % 4) {
      base64 += '=';
    }
    return this.base64ToArrayBuffer(base64);
  }

  /**
   * Convierte un ArrayBuffer a string base64url
   */
  arrayBufferToBase64Url(buffer) {
    const base64 = this.arrayBufferToBase64(buffer);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  /**
   * Registra una nueva credencial WebAuthn
   * @param {string} userId - ID del usuario
   * @param {string} userName - Nombre del usuario
   * @param {string} challenge - Challenge del servidor
   */
  async registerCredential(userId, userName, challenge) {
    if (!this.isAvailable()) {
      throw new Error('WebAuthn no está disponible en este navegador. Usa un navegador moderno o un dispositivo móvil.');
    }

    try {
      // Convertir challenge a ArrayBuffer
      const challengeBuffer = this.base64UrlToArrayBuffer(challenge);

      // Crear credencial pública
      const publicKeyCredentialCreationOptions = {
        challenge: challengeBuffer,
        rp: {
          name: 'Sistema de Control de Asistencia',
          id: window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(userId),
          name: userName,
          displayName: userName,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Usar lector del dispositivo
          userVerification: 'required',
        },
        timeout: 60000,
        attestation: 'direct',
      };

      // Crear la credencial
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      });

      if (!credential) {
        throw new Error('No se pudo crear la credencial');
      }

      // Extraer datos de la credencial
      const credentialId = this.arrayBufferToBase64Url(credential.rawId);
      const publicKey = this.arrayBufferToBase64Url(credential.response.getPublicKey());
      const attestationObject = this.arrayBufferToBase64Url(credential.response.attestationObject);
      const clientDataJSON = this.arrayBufferToBase64Url(credential.response.clientDataJSON);

      return {
        credential_id: credentialId,
        public_key: publicKey,
        attestation_object: attestationObject,
        client_data_json: clientDataJSON,
      };
    } catch (error) {
      console.error('Error al registrar credencial WebAuthn:', error);
      
      // Mensajes de error más amigables
      if (error.name === 'NotAllowedError') {
        throw new Error('Registro cancelado por el usuario o el dispositivo no está disponible');
      } else if (error.name === 'InvalidStateError') {
        throw new Error('Esta credencial ya está registrada');
      } else if (error.name === 'NotSupportedError') {
        throw new Error('El dispositivo no soporta autenticación biométrica');
      } else if (error.name === 'SecurityError') {
        throw new Error('Error de seguridad. Asegúrate de usar HTTPS o localhost');
      } else {
        throw new Error(`Error al registrar huella: ${error.message}`);
      }
    }
  }

  /**
   * Verifica una credencial WebAuthn existente
   * @param {string} challenge - Challenge del servidor
   * @param {Array} allowedCredentials - Lista de credential IDs permitidos (opcional)
   */
  async verifyCredential(challenge, allowedCredentials = null) {
    if (!this.isAvailable()) {
      throw new Error('WebAuthn no está disponible en este navegador. Usa un navegador moderno o un dispositivo móvil.');
    }

    try {
      // Convertir challenge a ArrayBuffer
      const challengeBuffer = this.base64UrlToArrayBuffer(challenge);

      // Preparar opciones de verificación
      const publicKeyCredentialRequestOptions = {
        challenge: challengeBuffer,
        timeout: 60000,
        userVerification: 'required',
      };

      // Si hay credenciales permitidas, convertirlas
      if (allowedCredentials && allowedCredentials.length > 0) {
        publicKeyCredentialRequestOptions.allowCredentials = allowedCredentials.map(cred => ({
          id: this.base64UrlToArrayBuffer(cred.id),
          type: 'public-key',
        }));
      }

      // Verificar la credencial
      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      });

      if (!assertion) {
        throw new Error('No se pudo verificar la credencial');
      }

      // Extraer datos de la aserción
      const credentialId = this.arrayBufferToBase64Url(assertion.rawId);
      const authenticatorData = this.arrayBufferToBase64Url(assertion.response.authenticatorData);
      const clientDataJSON = this.arrayBufferToBase64Url(assertion.response.clientDataJSON);
      const signature = this.arrayBufferToBase64Url(assertion.response.signature);

      return {
        credential_id: credentialId,
        authenticator_data: authenticatorData,
        client_data_json: clientDataJSON,
        signature: signature,
      };
    } catch (error) {
      console.error('Error al verificar credencial WebAuthn:', error);
      
      // Mensajes de error más amigables
      if (error.name === 'NotAllowedError') {
        throw new Error('Verificación cancelada por el usuario o el dispositivo no está disponible');
      } else if (error.name === 'InvalidStateError') {
        throw new Error('Error de estado. Intenta nuevamente');
      } else if (error.name === 'NotSupportedError') {
        throw new Error('El dispositivo no soporta autenticación biométrica');
      } else if (error.name === 'SecurityError') {
        throw new Error('Error de seguridad. Asegúrate de usar HTTPS o localhost');
      } else {
        throw new Error(`Error al verificar huella: ${error.message}`);
      }
    }
  }
}

const webauthnService = new WebAuthnService();
export default webauthnService;
