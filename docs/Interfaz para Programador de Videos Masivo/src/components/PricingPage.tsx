import { Button } from "./ui/button";
import { Check, Play, ArrowLeft } from "lucide-react";

interface PricingPageProps {
  onNavigate: (page: string) => void;
}

export function PricingPage({ onNavigate }: PricingPageProps) {
  const plans = [
    {
      name: "Starter",
      price: "9",
      description: "Para creadores que están comenzando",
      features: [
        "1 canal de YouTube",
        "Hasta 10 videos/mes",
        "Programación básica",
        "Soporte por email",
        "Analíticas básicas"
      ],
      highlighted: false
    },
    {
      name: "Pro",
      price: "29",
      description: "Para creadores profesionales",
      badge: "Más Popular",
      features: [
        "5 canales de YouTube",
        "Videos ilimitados",
        "Programación masiva",
        "Soporte prioritario 24/7",
        "Analíticas avanzadas",
        "Acceso anticipado a TikTok",
        "API access",
        "Gestión de equipo"
      ],
      highlighted: true
    },
    {
      name: "Enterprise",
      price: "99",
      description: "Para agencias y empresas",
      features: [
        "Canales ilimitados",
        "Videos ilimitados",
        "Programación masiva avanzada",
        "Soporte dedicado",
        "Analíticas personalizadas",
        "Multi-plataforma completo",
        "White-label",
        "SLA garantizado"
      ],
      highlighted: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 backdrop-blur-sm bg-black/50">
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
              onClick={() => onNavigate('landing')}
              className="hover:bg-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
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

      {/* Pricing Content */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-600/20 border border-red-600/30 rounded-full mb-6">
              <span className="text-sm text-red-400">Precios Transparentes</span>
            </div>
            <h1 className="text-5xl mb-4">Elige tu plan perfecto</h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Sin costos ocultos. Sin sorpresas. Cancela cuando quieras.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-gradient-to-br rounded-2xl p-8 ${
                  plan.highlighted
                    ? 'from-red-950/50 to-gray-950 border-2 border-red-600 shadow-2xl shadow-red-600/20 scale-105'
                    : 'from-gray-900 to-gray-950 border border-gray-800'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-red-600 text-white px-4 py-1 rounded-full text-sm">
                      {plan.badge}
                    </div>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl mb-2">{plan.name}</h3>
                  <p className="text-gray-400 mb-6">{plan.description}</p>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl">${plan.price}</span>
                    <span className="text-gray-400">/mes</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        plan.highlighted ? 'bg-red-600' : 'bg-gray-800'
                      }`}>
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => onNavigate('register')}
                  className={`w-full ${
                    plan.highlighted
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  {plan.highlighted ? 'Comenzar Ahora' : 'Seleccionar Plan'}
                </Button>
              </div>
            ))}
          </div>

          {/* FAQ or Additional Info */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-8 text-center">
            <h3 className="text-2xl mb-4">¿Necesitas un plan personalizado?</h3>
            <p className="text-gray-400 mb-6">
              Contacta con nuestro equipo de ventas para soluciones empresariales a medida
            </p>
            <Button
              variant="outline"
              className="border-red-600 text-red-500 hover:bg-red-600 hover:text-white"
            >
              Contactar Ventas
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
