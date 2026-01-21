"""
Módulo para manejar autenticación biométrica usando WebAuthn API
Permite usar el lector de huellas del teléfono móvil
"""

import json
import os
import base64
from datetime import datetime
from typing import Optional, Dict, List
import secrets


class WebAuthnDatabase:
    """Clase para gestionar credenciales WebAuthn"""
    
    def __init__(self, db_file: str = "alumnos.json"):
        """
        Inicializa la base de datos de credenciales WebAuthn
        
        Args:
            db_file: Archivo JSON donde se almacenan las credenciales
        """
        self.db_file = db_file
        self.fingerprints = {}
        self.load_database()
    
    def load_database(self):
        """Carga la base de datos desde el archivo"""
        if os.path.exists(self.db_file):
            try:
                with open(self.db_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.fingerprints = data
                print(f"✓ Base de datos cargada: {len(self.fingerprints)} usuarios registrados")
            except Exception as e:
                print(f"Error al cargar base de datos: {e}")
                self.fingerprints = {}
        else:
            self.fingerprints = {}
    
    def save_database(self):
        """Guarda la base de datos en el archivo"""
        try:
            with open(self.db_file, 'w', encoding='utf-8') as f:
                json.dump(self.fingerprints, f, indent=2, ensure_ascii=False)
            print(f"✓ Base de datos guardada")
        except Exception as e:
            print(f"Error al guardar base de datos: {e}")
    
    def add_credential(self, user_id: str, credential_id: str, public_key: str, name: str = ""):
        """
        Añade una credencial WebAuthn a la base de datos
        
        Args:
            user_id: ID único del usuario
            credential_id: ID de la credencial WebAuthn (base64)
            public_key: Clave pública de la credencial (base64)
            name: Nombre del usuario
        """
        if user_id not in self.fingerprints:
            self.fingerprints[user_id] = {
                'name': name,
                'registered_at': datetime.now().isoformat(),
                'credentials': []
            }
        
        # Agregar nueva credencial
        credential_data = {
            'credential_id': credential_id,
            'public_key': public_key,
            'registered_at': datetime.now().isoformat()
        }
        
        # Verificar que no exista ya esta credencial
        if 'credentials' not in self.fingerprints[user_id]:
            self.fingerprints[user_id]['credentials'] = []
        
        # Eliminar credenciales duplicadas
        self.fingerprints[user_id]['credentials'] = [
            c for c in self.fingerprints[user_id]['credentials']
            if c['credential_id'] != credential_id
        ]
        
        self.fingerprints[user_id]['credentials'].append(credential_data)
        self.save_database()
        print(f"✓ Credencial WebAuthn registrada para usuario: {user_id} ({name})")
    
    def get_user_credentials(self, user_id: str) -> List[Dict]:
        """Obtiene todas las credenciales de un usuario"""
        if user_id not in self.fingerprints:
            return []
        return self.fingerprints[user_id].get('credentials', [])
    
    def find_user_by_credential_id(self, credential_id: str) -> Optional[str]:
        """
        Encuentra el usuario que tiene una credencial específica
        
        Args:
            credential_id: ID de la credencial a buscar
            
        Returns:
            user_id si se encuentra, None en caso contrario
        """
        for user_id, user_data in self.fingerprints.items():
            credentials = user_data.get('credentials', [])
            for cred in credentials:
                if cred.get('credential_id') == credential_id:
                    return user_id
        return None
    
    def has_credentials(self, user_id: str) -> bool:
        """Verifica si un usuario tiene credenciales registradas"""
        if user_id not in self.fingerprints:
            return False
        credentials = self.fingerprints[user_id].get('credentials', [])
        return len(credentials) > 0
    
    def delete_user(self, user_id: str) -> bool:
        """
        Elimina un usuario de la base de datos
        
        Args:
            user_id: ID del usuario a eliminar
            
        Returns:
            True si se eliminó, False si no existe
        """
        if user_id in self.fingerprints:
            del self.fingerprints[user_id]
            self.save_database()
            print(f"✓ Usuario {user_id} eliminado")
            return True
        print(f"✗ Usuario {user_id} no encontrado")
        return False


class WebAuthnHandler:
    """Manejador para operaciones WebAuthn"""
    
    def __init__(self, db_file: str = "alumnos.json"):
        self.db = WebAuthnDatabase(db_file)
    
    def create_challenge(self) -> str:
        """
        Crea un challenge aleatorio para la autenticación WebAuthn
        
        Returns:
            Challenge codificado en base64
        """
        challenge = secrets.token_bytes(32)
        return base64.urlsafe_b64encode(challenge).decode('utf-8').rstrip('=')
    
    def verify_challenge(self, challenge: str) -> bool:
        """
        Verifica que un challenge sea válido (básico, en producción usar cache)
        
        Args:
            challenge: Challenge a verificar
            
        Returns:
            True si el formato es válido
        """
        try:
            decoded = base64.urlsafe_b64decode(challenge + '==')
            return len(decoded) >= 16
        except:
            return False
