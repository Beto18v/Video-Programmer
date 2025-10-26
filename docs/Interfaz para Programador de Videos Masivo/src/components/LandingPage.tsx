import { Button } from "./ui/button";
import { Play, Clock, Zap, Youtube, TrendingUp, Users, Video, CalendarClock } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 backdrop-blur-sm bg-black/50 fixed w-full z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <Play className="w-6 h-6 fill-white" />
            </div>
            <span className="text-xl">Programador de Videos Masivo</span>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => onNavigate('pricing')}
              className="hover:bg-gray-800"
            >
              Ver Precios
            </Button>
            <Button 
              onClick={() => onNavigate('login')}
              className="bg-red-600 hover:bg-red-700"
            >
              Login
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-600/20 border border-red-600/30 rounded-full">
                <Zap className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-400">Automatización Inteligente</span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl leading-tight">
                Programa tus videos de
                <span className="text-red-600"> YouTube </span>
                en segundos
              </h1>
              
              <p className="text-xl text-gray-400">
                Gestiona, programa y publica contenido en YouTube y TikTok de forma masiva. 
                Ahorra tiempo y maximiza tu alcance con automatización profesional.
              </p>

              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg"
                  onClick={() => onNavigate('register')}
                  className="bg-red-600 hover:bg-red-700 text-lg px-8"
                >
                  Comenzar Gratis
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => onNavigate('pricing')}
                  className="border-gray-700 hover:bg-gray-800 text-lg px-8"
                >
                  Ver Planes
                </Button>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div>
                  <div className="text-3xl text-red-600">10K+</div>
                  <div className="text-sm text-gray-400">Videos Programados</div>
                </div>
                <div className="w-px h-12 bg-gray-800"></div>
                <div>
                  <div className="text-3xl text-red-600">500+</div>
                  <div className="text-sm text-gray-400">Creadores Activos</div>
                </div>
                <div className="w-px h-12 bg-gray-800"></div>
                <div>
                  <div className="text-3xl text-red-600">99.9%</div>
                  <div className="text-sm text-gray-400">Uptime</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-red-600/20 blur-3xl"></div>
              <ImageWithFallback 
                src="https://images.unsplash.com/photo-1739296385442-a775d63e026c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aWRlbyUyMHByb2R1Y3Rpb24lMjB0ZWNobm9sb2d5fGVufDF8fHx8MTc2MTI4NzA3N3ww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Video Production"
                className="relative rounded-2xl shadow-2xl w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-black/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl mb-4">Potencia tu contenido</h2>
            <p className="text-gray-400 text-lg">Todo lo que necesitas para dominar YouTube y TikTok</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-xl p-6 hover:border-red-600/50 transition-all">
              <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center mb-4">
                <CalendarClock className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl mb-2">Programación Masiva</h3>
              <p className="text-gray-400">
                Programa cientos de videos con un solo clic. Automatiza tu calendario de contenido.
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-xl p-6 hover:border-red-600/50 transition-all">
              <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center mb-4">
                <Youtube className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl mb-2">Multi-Plataforma</h3>
              <p className="text-gray-400">
                Gestiona YouTube hoy, TikTok mañana. Una plataforma para todas tus redes.
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-xl p-6 hover:border-red-600/50 transition-all">
              <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl mb-2">Analíticas en Tiempo Real</h3>
              <p className="text-gray-400">
                Monitorea el rendimiento de tus videos y optimiza tu estrategia.
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-xl p-6 hover:border-red-600/50 transition-all">
              <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl mb-2">Gestión de Canales</h3>
              <p className="text-gray-400">
                Administra múltiples canales desde un solo dashboard centralizado.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl mb-4">Cómo funciona</h2>
            <p className="text-gray-400 text-lg">Tres simples pasos para automatizar tu contenido</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-xl p-8 text-center">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
                  1
                </div>
                <Video className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl mb-3">Conecta tus canales</h3>
                <p className="text-gray-400">
                  Vincula tus cuentas de YouTube y TikTok de forma segura en segundos.
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-red-600 to-transparent"></div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-xl p-8 text-center">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
                  2
                </div>
                <Clock className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl mb-3">Programa tus videos</h3>
                <p className="text-gray-400">
                  Sube tu contenido y programa fechas de publicación de forma masiva.
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-red-600 to-transparent"></div>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
                3
              </div>
              <Zap className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl mb-3">Relájate y observa</h3>
              <p className="text-gray-400">
                Deja que la automatización haga su magia mientras tú creas más contenido.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-red-950/50 to-gray-950/50 border-y border-red-900/30">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl mb-6">¿Listo para revolucionar tu contenido?</h2>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Únete a cientos de creadores que ya están automatizando su estrategia de contenido
          </p>
          <Button 
            size="lg"
            onClick={() => onNavigate('register')}
            className="bg-red-600 hover:bg-red-700 text-lg px-12"
          >
            Comenzar Ahora
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-800">
        <div className="container mx-auto text-center text-gray-500">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <Play className="w-5 h-5 fill-white" />
            </div>
            <span>Programador de Videos Masivo</span>
          </div>
          <p>© 2025 Todos los derechos reservados</p>
        </div>
      </footer>
    </div>
  );
}
