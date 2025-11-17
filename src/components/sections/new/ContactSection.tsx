import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!formData.name.trim()) {
      toast.error("Por favor, preencha seu nome");
      return;
    }
    
    if (!emailRegex.test(formData.email)) {
      toast.error("Email inválido");
      return;
    }
    
    if (!formData.message.trim()) {
      toast.error("Por favor, escreva uma mensagem");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        message: formData.message.trim()
      };
      
      const response = await fetch(
        'https://sabrinaseibert.app.n8n.cloud/webhook/emailcontato',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );
      
      if (!response.ok) throw new Error('Erro ao enviar');
      
      toast.success("Mensagem enviada com sucesso! Entraremos em contato em breve.");
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      console.error('Erro ao enviar:', error);
      toast.error("Erro ao enviar mensagem. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contato" className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold">Fale com a gente</h2>
          <p className="text-muted-foreground">Nos conte sobre seu evento e como podemos ajudar.</p>
        </div>

        <Card className="max-w-2xl mx-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input 
                  id="name" 
                  placeholder="Seu nome" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  maxLength={100}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="seu@email.com" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  maxLength={255}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="message">Mensagem</Label>
              <Textarea 
                id="message" 
                placeholder="Conte sobre seu evento" 
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                required
                maxLength={1000}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Enviar"}
            </Button>
          </form>
        </Card>
      </div>
    </section>
  );
};

export default ContactSection;