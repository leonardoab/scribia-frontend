import { useState } from "react";
import { Check, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const plans = [
  {
    name: "Basic",
    description: "Perfeito para começar",
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      "3 ebooks por dia",
      "Acesso à plataforma ScribIA",
      "Biblioteca ScribIA de eventos",
      "Ebooks compactos não personalizados"
    ],
    cta: "Começar Grátis",
    featured: false
  },
  {
    name: "Plus",
    description: "Para quem quer ilimitado",
    monthlyPrice: 68,
    annualPrice: 48,
    features: [
      "Livebooks personalizados ilimitados",
      "Tutor IA completo",
      "Dashboard avançado",
      "Integrações com plataformas",
      "Suporte prioritário"
    ],
    cta: "Assinar Agora",
    featured: true
  },
  {
    name: "Eventos, Patrocinadores e Influenciadores",
    description: "Soluções exclusivas",
    monthlyPrice: null,
    annualPrice: null,
    features: [
      "Ferramentas personalizadas para eventos",
      "Suporte dedicado",
      "Configuração conforme necessidade"
    ],
    cta: "Agende sua Sessão",
    featured: false
  }
];

const PricingSectionNew = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section id="precos" className="py-16 md:py-24 bg-gradient-to-b from-primary/10 to-secondary/10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Tag className="h-4 w-4" /> Planos e Preços
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Escolha o Plano Ideal para Seu Evento
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Soluções flexíveis que crescem com suas necessidades
          </p>
        </div>
        
        <div className="flex items-center justify-center gap-3 mb-10">
          <span className="text-sm font-medium">Mensal</span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative w-14 h-7 rounded-full transition-colors ${isAnnual ? 'bg-primary' : 'bg-muted'}`}
          >
            <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${isAnnual ? 'translate-x-7' : 'translate-x-0'}`} />
          </button>
          <span className="text-sm font-medium">
            Anual <small className="text-primary">(-20%)</small>
          </span>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, idx) => (
            <Card 
              key={idx} 
              className={`relative hover:-translate-y-1 transition-all ${
                plan.featured ? 'border-2 border-primary scale-105 shadow-xl' : ''
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold">
                  MAIS POPULAR
                </div>
              )}
              <CardContent className="p-6">
                <div className="text-center pb-4 border-b mb-4">
                  <h3 className="text-xl font-bold text-primary mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
                
                <div className="flex items-baseline justify-center my-6">
                  {plan.monthlyPrice === null ? (
                    <span className="text-2xl font-bold text-primary">Sob Consulta</span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold text-primary mr-1">
                        R$ {isAnnual ? plan.annualPrice : plan.monthlyPrice}
                      </span>
                      <span className="text-sm text-muted-foreground">/mês</span>
                    </>
                  )}
                </div>
                
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  variant={plan.featured ? "cta" : "outline"} 
                  size="lg" 
                  className="w-full"
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSectionNew;