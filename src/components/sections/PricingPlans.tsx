import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BookOpen, Link2, Bot, BarChart3, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface FormData {
  nome_completo: string;
  email: string;
  whatsapp: string;
}

const PricingPlans = () => {
  const [formData, setFormData] = useState<FormData>({
    nome_completo: "",
    email: "",
    whatsapp: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const normalizeWhatsApp = (value: string) => value.replace(/\D/g, "");
  const validateWhatsApp = (digits: string) => digits.length >= 10 && digits.length <= 11;

  const formatWhatsApp = (value: string) => {
    const digits = normalizeWhatsApp(value);
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatWhatsApp(e.target.value);
    setFormData({ ...formData, whatsapp: formatted });
  };

  const handleFreeSubmit = async () => {
    const { nome_completo, email, whatsapp } = formData;
    const whatsappDigits = normalizeWhatsApp(whatsapp);

    if (!nome_completo.trim() || !validateEmail(email) || !validateWhatsApp(whatsappDigits)) {
      toast({
        title: "Erro de validação",
        description: "Por favor, preencha todos os campos corretamente.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('scribia-free-signup', {
        body: {
          nome_completo: nome_completo.trim(),
          email: email.trim(),
          whatsapp: whatsappDigits,
        }
      });

      if (error) {
        console.error("Erro ao cadastrar:", error);
        toast({
          title: "Erro",
          description: "Ops! Não conseguimos registrar seus dados. Tente novamente em instantes.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso!",
        description: "Agradecemos seu cadastro. Link de acesso enviado para o seu email.",
      });

      setIsDialogOpen(false);
      setFormData({ nome_completo: "", email: "", whatsapp: "" });

    } catch (error) {
      console.error("Erro inesperado:", error);
      toast({
        title: "Erro",
        description: "Ops! Não conseguimos registrar seus dados. Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const b2cPlans = [
    {
      name: "Basic",
      price: "Grátis",
      badge: "Para você",
      icon: BookOpen,
      features: [
        "Até 3 palestras convertidas em ebooks compactos",
        "PDF com estrutura padrão",
        "Acesso individual para teste"
      ],
      cta: "Começar grátis",
      ctaAction: "free"
    },
    {
      name: "Plus",
      price: "B2C",
      badge: "Para você",
      icon: Link2,
      features: [
        "Ebooks na versão compacto ou completo",
        "Links interativos e referências complementares"
      ],
      cta: "Quero o Plus",
      ctaAction: "plus"
    }
  ];

  const b2bPlans = [
    {
      name: "Pro",
      price: "Organizadores",
      badge: "Para organizadores",
      icon: Bot,
      features: [
        "Tutor IA para dúvidas de congressistas",
        "Banco pesquisável de palestras",
        "Suporte durante o congresso"
      ],
      cta: "Solicitar demonstração",
      ctaAction: "demo"
    },
    {
      name: "Premium",
      price: "Organizadores Avançado",
      badge: "Para organizadores",
      icon: BarChart3,
      features: [
        "Dashboard de engajamento e acessos",
        "Relatórios de interesse da audiência",
        "Exportação e integração com CRM/evento"
      ],
      cta: "Falar com vendas",
      ctaAction: "sales"
    }
  ];

  const handleCTAClick = (action: string) => {
    if (action === "free") {
      window.location.href = "https://www.scribia.app.br";
      return;
    } else {
      // Para outros CTAs, pode implementar outras ações
      toast({
        title: "Em breve",
        description: "Esta funcionalidade estará disponível em breve!",
      });
    }
  };

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-secondary/10 to-background">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Planos para você
          </h2>
          <p className="text-lg text-muted-foreground">
            Escolha o que faz sentido agora — evolua quando precisar.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {b2cPlans.map((plan, index) => {
                const Icon = plan.icon;
                return (
                  <Card key={index} className="relative shadow-elegant hover-scale">
                    <Badge 
                      variant="secondary" 
                      className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-accent text-accent-foreground"
                    >
                      {plan.badge}
                    </Badge>
                    <CardHeader className="text-center pt-8">
                      <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <p className="text-2xl font-bold text-primary">{plan.price}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-3">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button 
                        className="w-full"
                        variant={plan.name === "Basic" ? "default" : "outline"}
                        onClick={() => handleCTAClick(plan.ctaAction)}
                      >
                        {plan.cta}
                      </Button>
                    </CardContent>
                  </Card>
              );
            })}
        </div>

        {/* Dialog for free plan */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Começar teste gratuito</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dialog-nome">Nome completo *</Label>
                <Input
                  id="dialog-nome"
                  type="text"
                  placeholder="Seu nome completo"
                  value={formData.nome_completo}
                  onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dialog-email">E-mail *</Label>
                <Input
                  id="dialog-email"
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dialog-whatsapp">Nº de WhatsApp *</Label>
                <Input
                  id="dialog-whatsapp"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={formData.whatsapp}
                  onChange={handleWhatsAppChange}
                  maxLength={15}
                  required
                />
              </div>

              <Button
                onClick={handleFreeSubmit}
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? "Enviando..." : "Começar teste gratuito"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};

export default PricingPlans;