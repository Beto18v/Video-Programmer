#!/usr/bin/env python3
"""
Script para probar las funcionalidades de seguridad implementadas.
"""

import asyncio
import json
import time
from pathlib import Path

import httpx
from loguru import logger


class SecurityTester:
    """Tester para verificar funcionalidades de seguridad."""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=30.0)
        
    async def test_security_headers(self):
        """Prueba los headers de seguridad."""
        logger.info("🔒 Probando headers de seguridad...")
        
        try:
            response = await self.client.get(f"{self.base_url}/health")
            headers = response.headers
            
            security_headers = {
                "X-Content-Type-Options": "nosniff",
                "X-Frame-Options": ["DENY", "SAMEORIGIN"],
                "X-XSS-Protection": "1; mode=block",
                "Referrer-Policy": "strict-origin-when-cross-origin",
                "Content-Security-Policy": None,  # Verificar que existe
            }
            
            results = {}
            for header, expected in security_headers.items():
                if header in headers:
                    actual = headers[header]
                    if expected is None:
                        results[header] = "✅ Presente"
                    elif isinstance(expected, list):
                        if actual in expected:
                            results[header] = f"✅ {actual}"
                        else:
                            results[header] = f"❌ Esperado: {expected}, Actual: {actual}"
                    elif actual == expected:
                        results[header] = f"✅ {actual}"
                    else:
                        results[header] = f"❌ Esperado: {expected}, Actual: {actual}"
                else:
                    results[header] = "❌ Faltante"
            
            logger.info("Headers de seguridad:")
            for header, result in results.items():
                logger.info(f"  {header}: {result}")
                
        except Exception as e:
            logger.error(f"Error probando headers: {e}")
    
    async def test_rate_limiting(self):
        """Prueba el rate limiting."""
        logger.info("⏱️ Probando rate limiting...")
        
        try:
            # Hacer muchas requests rápidamente
            requests_made = 0
            rate_limited = False
            
            for i in range(70):  # Más del límite por defecto
                response = await self.client.get(f"{self.base_url}/health")
                requests_made += 1
                
                if response.status_code == 429:
                    rate_limited = True
                    retry_after = response.headers.get("Retry-After", "No especificado")
                    logger.info(f"✅ Rate limiting activado después de {requests_made} requests")
                    logger.info(f"   Retry-After: {retry_after}")
                    break
                
                # Rate limit headers
                if i == 0:  # Solo mostrar en la primera request
                    limit = response.headers.get("X-RateLimit-Limit", "No especificado")
                    remaining = response.headers.get("X-RateLimit-Remaining", "No especificado")
                    logger.info(f"   Límite: {limit}, Restantes: {remaining}")
            
            if not rate_limited:
                logger.warning("⚠️ Rate limiting no se activó - revisar configuración")
                
        except Exception as e:
            logger.error(f"Error probando rate limiting: {e}")
    
    async def test_cors_headers(self):
        """Prueba la configuración de CORS."""
        logger.info("🌐 Probando configuración CORS...")
        
        try:
            # Preflight request
            response = await self.client.options(
                f"{self.base_url}/api/v1/health",
                headers={
                    "Origin": "http://localhost:3000",
                    "Access-Control-Request-Method": "GET",
                    "Access-Control-Request-Headers": "Authorization"
                }
            )
            
            cors_headers = {
                "Access-Control-Allow-Origin": response.headers.get("Access-Control-Allow-Origin"),
                "Access-Control-Allow-Methods": response.headers.get("Access-Control-Allow-Methods"),
                "Access-Control-Allow-Headers": response.headers.get("Access-Control-Allow-Headers"),
                "Access-Control-Allow-Credentials": response.headers.get("Access-Control-Allow-Credentials"),
            }
            
            logger.info("Headers CORS:")
            for header, value in cors_headers.items():
                status = "✅" if value else "❌"
                logger.info(f"  {header}: {status} {value or 'Faltante'}")
                
        except Exception as e:
            logger.error(f"Error probando CORS: {e}")
    
    async def test_request_id_tracking(self):
        """Prueba el tracking de request IDs."""
        logger.info("🔍 Probando tracking de Request ID...")
        
        try:
            response = await self.client.get(f"{self.base_url}/health")
            request_id = response.headers.get("X-Request-ID")
            
            if request_id:
                logger.info(f"✅ Request ID generado: {request_id}")
            else:
                logger.warning("⚠️ Request ID no encontrado en headers")
                
        except Exception as e:
            logger.error(f"Error probando Request ID: {e}")
    
    async def test_health_endpoints(self):
        """Prueba los endpoints de salud."""
        logger.info("💚 Probando endpoints de salud...")
        
        endpoints = ["/health", "/ready", "/live"]
        
        for endpoint in endpoints:
            try:
                response = await self.client.get(f"{self.base_url}{endpoint}")
                if response.status_code == 200:
                    data = response.json()
                    logger.info(f"✅ {endpoint}: {data.get('status', 'OK')}")
                else:
                    logger.warning(f"⚠️ {endpoint}: Status {response.status_code}")
            except Exception as e:
                logger.error(f"❌ {endpoint}: Error - {e}")
    
    async def test_ssl_redirect(self):
        """Prueba redirección HTTP -> HTTPS (si aplica)."""
        if "https" in self.base_url:
            logger.info("🔒 Probando configuración SSL...")
            
            try:
                # Intentar conexión HTTP si estamos usando HTTPS
                http_url = self.base_url.replace("https://", "http://")
                response = await self.client.get(f"{http_url}/health", follow_redirects=False)
                
                if response.status_code in [301, 302, 307, 308]:
                    location = response.headers.get("Location", "")
                    if "https" in location:
                        logger.info("✅ Redirección HTTP -> HTTPS configurada")
                    else:
                        logger.warning("⚠️ Redirección encontrada pero no a HTTPS")
                else:
                    logger.warning("⚠️ No se encontró redirección HTTP -> HTTPS")
                    
            except Exception as e:
                logger.info(f"ℹ️ No se pudo probar redirección SSL: {e}")
    
    async def test_error_handling(self):
        """Prueba el manejo de errores centralizado."""
        logger.info("🚨 Probando manejo de errores...")
        
        try:
            # Probar endpoint inexistente
            response = await self.client.get(f"{self.base_url}/api/v1/nonexistent")
            
            if response.status_code == 404:
                try:
                    error_data = response.json()
                    if "error" in error_data and "request_id" in error_data.get("error", {}):
                        logger.info("✅ Manejo de errores estructurado funcionando")
                        logger.info(f"   Request ID: {error_data['error']['request_id']}")
                    else:
                        logger.warning("⚠️ Respuesta de error no tiene estructura esperada")
                except json.JSONDecodeError:
                    logger.warning("⚠️ Respuesta de error no es JSON válido")
            else:
                logger.warning(f"⚠️ Endpoint inexistente retornó {response.status_code} en lugar de 404")
                
        except Exception as e:
            logger.error(f"Error probando manejo de errores: {e}")
    
    async def run_all_tests(self):
        """Ejecuta todas las pruebas de seguridad."""
        logger.info("🧪 Iniciando pruebas de seguridad...")
        logger.info(f"   URL base: {self.base_url}")
        
        tests = [
            self.test_health_endpoints,
            self.test_security_headers,
            self.test_cors_headers,
            self.test_request_id_tracking,
            self.test_error_handling,
            self.test_ssl_redirect,
            self.test_rate_limiting,  # Al final porque puede tomar tiempo
        ]
        
        for test in tests:
            try:
                await test()
                await asyncio.sleep(1)  # Pausa entre pruebas
            except Exception as e:
                logger.error(f"Error en {test.__name__}: {e}")
        
        logger.info("🏁 Pruebas de seguridad completadas")
    
    async def close(self):
        """Cierra el cliente HTTP."""
        await self.client.aclose()


async def main():
    """Función principal."""
    import sys
    
    # Configurar logging
    logger.remove()
    logger.add(sys.stdout, format="<green>{time:HH:mm:ss}</green> | <level>{message}</level>")
    
    # URL base desde argumentos o por defecto
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
    
    tester = SecurityTester(base_url)
    
    try:
        await tester.run_all_tests()
    finally:
        await tester.close()


if __name__ == "__main__":
    asyncio.run(main())