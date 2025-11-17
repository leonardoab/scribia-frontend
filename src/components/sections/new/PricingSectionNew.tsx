import { useState } from "react";
import { Check, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    empresa: '',
    email: '',
    whatsapp: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatWhatsApp = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
    if (digits.length <= 11) 
      return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
    return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7,11)}`;
  };

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const whatsappDigits = formData.whatsapp.replace(/\D/g, '');
    
    if (!formData.nome.trim()) {
      toast.error("Por favor, preencha seu nome");
      return false;
    }
    if (!emailRegex.test(formData.email)) {
      toast.error("Email inválido");
      return false;
    }
    if (whatsappDigits.length < 10 || whatsappDigits.length > 11) {
      toast.error("WhatsApp deve ter 10 ou 11 dígitos");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const payload = {
        nome: formData.nome.trim(),
        empresa: formData.empresa.trim() || null,
        email: formData.email.trim(),
        whatsapp: formData.whatsapp.replace(/\D/g, '')
      };
      
      const response = await fetch(
        'https://sabrinaseibert.app.n8n.cloud/webhook/sessaoestrategica',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );
      
      if (!response.ok) throw new Error('Erro ao enviar');
      
      toast.success("Mensagem enviada com sucesso. Aguarde o contato do Setor de Planejamento do ScribIA.");
      setFormData({ nome: '', empresa: '', email: '', whatsapp: '' });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Erro ao enviar:', error);
      toast.error("Erro ao agendar sessão. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
                  onClick={() => {
                    if (plan.cta === "Agende sua Sessão") {
                      setIsDialogOpen(true);
                    }
                  }}
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Quero agendar uma Sessão</DialogTitle>
              <DialogDescription>
                Preencha os dados abaixo para agendar sua sessão estratégica
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  required
                  maxLength={120}
                />
              </div>
              <div>
                <Label htmlFor="empresa">Empresa</Label>
                <Input
                  id="empresa"
                  value={formData.empresa}
                  onChange={(e) => setFormData({...formData, empresa: e.target.value})}
                  maxLength={120}
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  maxLength={255}
                />
              </div>
              <div>
                <Label htmlFor="whatsapp">WhatsApp *</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({
                    ...formData, 
                    whatsapp: formatWhatsApp(e.target.value)
                  })}
                  placeholder="(11) 99999-9999"
                  required
                  maxLength={15}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Agendar Sessão"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};

export default PricingSectionNew;