#!/usr/bin/env python3
"""
Guía detallada para crear Google Service Account - PASO A PASO
"""

def show_detailed_guide():
    print("🔐 GUÍA DETALLADA: Crear Google Service Account")
    print("=" * 60)

    print("\n🚀 PASO 1: Ir a Google Cloud Console")
    print("   📱 Abre tu navegador y ve a: https://console.cloud.google.com/")
    print("   🔑 Asegúrate de estar logueado con tu cuenta: nicolasalbertov18")
    print("   📂 Selecciona tu proyecto existente o crea uno nuevo")

    print("\n🚀 PASO 2: Habilitar Google Sheets API")
    print("   1. En el menú lateral izquierdo, click en 'APIs & Services'")
    print("   2. Click en 'Library' (Biblioteca)")
    print("   3. En el buscador, escribe: 'Google Sheets API'")
    print("   4. Click en 'Google Sheets API' en los resultados")
    print("   5. Click en 'Enable' (Habilitar) - botón azul")

    print("\n🚀 PASO 3: Crear Service Account")
    print("   1. En el menú lateral, click en 'APIs & Services' > 'Credentials'")
    print("   2. Click en '+ CREATE CREDENTIALS' (botón azul arriba)")
    print("   3. Selecciona 'Service Account' del menú desplegable")

    print("\n🚀 PASO 4: Configurar Service Account")
    print("   📝 Service account details:")
    print("   - Service account name: video-programmer-sheets")
    print("   - Service account ID: (se genera automáticamente)")
    print("   - Description: Service account for automated Google Sheets access")
    print("   🔄 Click 'CREATE AND CONTINUE'")

    print("\n🚀 PASO 5: Otorgar permisos (opcional)")
    print("   💡 Puedes saltar este paso por ahora")
    print("   🔄 Click 'CONTINUE'")

    print("\n🚀 PASO 6: Crear clave JSON")
    print("   1. Click 'DONE' en la pantalla de permisos")
    print("   2. Verás tu Service Account en la lista")
    print("   3. Click en el nombre de la Service Account que acabas de crear")
    print("   4. Ve a la pestaña 'Keys' (arriba)")
    print("   5. Click en 'ADD KEY' > 'Create new key'")
    print("   6. Selecciona 'JSON' como tipo de clave")
    print("   7. Click 'CREATE'")

    print("\n🚀 PASO 7: Descargar archivo")
    print("   📁 El archivo JSON se descargará automáticamente")
    print("   💾 Guárdalo en un lugar seguro (lo necesitarás después)")

    print("\n🚀 PASO 8: Compartir Sheets con Service Account")
    print("   🔗 Abre tu Google Sheet de Religion:")
    print("      https://docs.google.com/spreadsheets/d/1vBXtJuJR_faNGFBMSqW9U_1izibSQrrDNZLMtb5ViqE")
    print("   👥 Click 'Share' (esquina superior derecha)")
    print("   📧 Pega el email de la Service Account (termina en @tu-proyecto.iam.gserviceaccount.com)")
    print("   👁️ Dale permisos de 'Viewer' (solo lectura)")
    print("   ✅ Click 'Share'")

    print("\n🚀 PASO 9: Repetir para Phrases Sheet")
    print("   🔗 Abre tu Google Sheet de Phrases:")
    print("      https://docs.google.com/spreadsheets/d/1vBXtJuJR_faNGFBMSqW9U_1izibSQrrDNZLMtb5ViqE")
    print("   👥 Repite el proceso de compartir con la misma Service Account")

    print("\n🚀 PASO 10: Configurar en el proyecto")
    print("   📁 Mueve el archivo JSON descargado a la raíz del proyecto")
    print("   ✏️ Renómbralo como 'service-account.json'")
    print("   ⚙️ El .env ya está configurado con:")
    print("      GOOGLE_SERVICE_ACCOUNT_FILE=service-account.json")

    print("\n🚀 PASO 11: Verificar configuración")
    print("   💻 Ejecuta en terminal:")
    print("      python scripts/setup_service_account.py --check")

    print("\n🚀 PASO 12: Probar integración")
    print("   🧪 Ejecuta:")
    print("      python scripts/test_sheets_integration.py")

    print("\n" + "=" * 60)
    print("✅ ¡Listo! Tu Service Account estará configurada")
    print("💡 Si tienes problemas, verifica que:")
    print("   - El proyecto esté activo en Google Cloud")
    print("   - La API esté habilitada")
    print("   - Los Sheets estén compartidos correctamente")
    print("   - El archivo JSON no esté corrupto")

def show_troubleshooting():
    print("\n🔧 SOLUCIÓN DE PROBLEMAS:")
    print("=" * 40)

    print("\n❌ 'API has not been used in project' o similar:")
    print("   ✅ Ve a APIs & Services > Library y habilita 'Google Sheets API'")

    print("\n❌ 'Access denied' al compartir Sheet:")
    print("   ✅ Asegúrate de que el email de Service Account sea correcto")
    print("   ✅ Dale permisos de 'Viewer' al menos")

    print("\n❌ 'Invalid credentials' en la app:")
    print("   ✅ Verifica que el archivo JSON sea válido")
    print("   ✅ Que esté en la raíz del proyecto")
    print("   ✅ Que el .env tenga la ruta correcta")

    print("\n❌ 'The caller does not have permission':")
    print("   ✅ Comparte el Sheet con la Service Account")
    print("   ✅ Espera unos minutos para que los permisos se propaguen")

if __name__ == "__main__":
    show_detailed_guide()
    show_troubleshooting()