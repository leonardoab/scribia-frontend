import { useState, useEffect } from "react"; // v1.0.1
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { toast } from "sonner";
import { BookOpen, Loader2 } from "lucide-react";

const DefinirPerfil = () => {
  const [nivelPreferido, setNivelPreferido] = useState("");
  const [formatoPreferido, setFormatoPreferido] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateProfile, user, loading } = useCustomAuth();
  const navigate = useNavigate();

  // Redirecionar se o perfil já estiver definido
  useEffect(() => {
    if (!loading && user?.profile?.perfil_definido) {
      navigate("/dashboard", { replace: true });
    }
  }, [loading, user?.profile?.perfil_definido, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nivelPreferido || !formatoPreferido) {
      toast.error("Por favor, selecione todas as preferências");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updateProfile(nivelPreferido, formatoPreferido);

      if (result.success) {
        toast.success("Perfil definido com sucesso!");
        // Aguardar mais tempo para garantir que o estado foi completamente atualizado
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 800);
      } else {
        toast.error(result.error || "Erro ao salvar preferências");
      }
    } catch (error) {
      toast.error("Erro ao salvar preferências");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl md:text-3xl">Defina suas Preferências</CardTitle>
          <CardDescription>
            Personalize sua experiência no ScribIA para receber livebooks adequados ao seu perfil
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Nível de Conhecimento */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Nível de Conhecimento Preferido</Label>
              <RadioGroup value={nivelPreferido} onValueChange={setNivelPreferido}>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-4 rounded-lg border hover:border-purple-300 hover:bg-purple-50/50 transition-colors">
                    <RadioGroupItem value="junior" id="junior" className="mt-1" />
                    <Label htmlFor="junior" className="cursor-pointer flex-1">
                      <div className="font-medium">Júnior</div>
                      <div className="text-sm text-muted-foreground">
                        Conteúdo introdutório e conceitos fundamentais
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3 p-4 rounded-lg border hover:border-purple-300 hover:bg-purple-50/50 transition-colors">
                    <RadioGroupItem value="pleno" id="pleno" className="mt-1" />
                    <Label htmlFor="pleno" className="cursor-pointer flex-1">
                      <div className="font-medium">Pleno</div>
                      <div className="text-sm text-muted-foreground">
                        Aprofundamento moderado com exemplos práticos
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3 p-4 rounded-lg border hover:border-purple-300 hover:bg-purple-50/50 transition-colors">
                    <RadioGroupItem value="senior" id="senior" className="mt-1" />
                    <Label htmlFor="senior" className="cursor-pointer flex-1">
                      <div className="font-medium">Sênior</div>
                      <div className="text-sm text-muted-foreground">
                        Conteúdo técnico detalhado e análises profundas
                      </div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Formato Preferido */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Formato de Livebook Preferido</Label>
              <RadioGroup value={formatoPreferido} onValueChange={setFormatoPreferido}>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-4 rounded-lg border hover:border-purple-300 hover:bg-purple-50/50 transition-colors">
                    <RadioGroupItem value="compacto" id="compacto" className="mt-1" />
                    <Label htmlFor="compacto" className="cursor-pointer flex-1">
                      <div className="font-medium">Compacto</div>
                      <div className="text-sm text-muted-foreground">
                        Pontos principais e conclusões objetivas
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3 p-4 rounded-lg border hover:border-purple-300 hover:bg-purple-50/50 transition-colors">
                    <RadioGroupItem value="completo" id="completo" className="mt-1" />
                    <Label htmlFor="completo" className="cursor-pointer flex-1">
                      <div className="font-medium">Completo</div>
                      <div className="text-sm text-muted-foreground">
                        Análise completa com todos os tópicos abordados
                      </div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Preferências"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DefinirPerfil;
