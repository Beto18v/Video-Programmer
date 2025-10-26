<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Autenticación Completada</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background-color: #f8f9fa;
        }

        .container {
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .success-icon {
            color: #10b981;
            font-size: 3rem;
            margin-bottom: 1rem;
        }

        .message {
            color: #374151;
            font-size: 1.125rem;
            margin-bottom: 1.5rem;
        }

        .loading {
            color: #6b7280;
            font-size: 0.875rem;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="success-icon">✓</div>
        <div class="message">{{ $message }}</div>
        <div class="loading">Cerrando ventana...</div>
    </div>

    <script>
        // Cerrar el popup y recargar la ventana padre
        if (window.opener && !window.opener.closed) {
            // Recargar la ventana padre
            window.opener.location.reload();
            // Cerrar este popup después de un breve delay
            setTimeout(function() {
                window.close();
            }, 1000);
        } else {
            // Si no hay ventana padre, redirigir normalmente
            window.location.href = '{{ $redirectUrl }}';
        }
    </script>
</body>

</html>