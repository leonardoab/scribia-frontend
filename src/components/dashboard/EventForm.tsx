import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Evento, EventoFormData } from "@/types/evento";

interface EventFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: EventoFormData) => Promise<void>;
  evento?: Evento | null;
  loading: boolean;
}

export function EventForm({ open, onOpenChange, onSubmit, evento, loading }: EventFormProps) {
  const [formData, setFormData] = useState<EventoFormData>({
    nome_evento: "",
    data_inicio: "",
    data_fim: "",
    formato_evento: "",
    cidade: "",
    estado: "",
    pais: "",
    observacoes: "",
  });

  useEffect(() => {
    if (evento) {
      console.log('Evento recebido:', evento);
      setFormData({
        nome_evento: evento.nome_evento,
        data_inicio: evento.data_inicio ? evento.data_inicio.split('T')[0] : "",
        data_fim: evento.data_fim ? evento.data_fim.split('T')[0] : "",
        formato_evento: evento.formato_evento || "",
        cidade: evento.cidade || "",
        estado: evento.estado || "",
        pais: evento.pais || "",
        observacoes: evento.observacoes || "",
      });
    } else {
      setFormData({
        nome_evento: "",
        data_inicio: "",
        data_fim: "",
        formato_evento: "",
        cidade: "",
        estado: "",
        pais: "",
        observacoes: "",
      });
    }
  }, [evento, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{evento ? "Editar Evento" : "Novo Evento"}</DialogTitle>
          <DialogDescription>
            {evento ? "Atualize as informações do evento" : "Preencha os dados do novo evento"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome_evento">Nome do Evento *</Label>
              <Input
                id="nome_evento"
                placeholder="Ex: Workshop de IA 2025"
                value={formData.nome_evento}
                onChange={(e) => setFormData({ ...formData, nome_evento: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_inicio">Data Início</Label>
                <Input
                  id="data_inicio"
                  type="date"
                  value={formData.data_inicio}
                  onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_fim">Data Fim</Label>
                <Input
                  id="data_fim"
                  type="date"
                  value={formData.data_fim}
                  onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Formato do Evento</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="formato_evento"
                    value="presencial"
                    checked={formData.formato_evento === 'presencial'}
                    onChange={(e) => setFormData({...formData, formato_evento: e.target.value})}
                    className="w-4 h-4"
                  />
                  <span>Presencial</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="formato_evento"
                    value="remoto"
                    checked={formData.formato_evento === 'remoto'}
                    onChange={(e) => setFormData({...formData, formato_evento: e.target.value})}
                    className="w-4 h-4"
                  />
                  <span>Remoto</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="formato_evento"
                    value="hibrido"
                    checked={formData.formato_evento === 'hibrido'}
                    onChange={(e) => setFormData({...formData, formato_evento: e.target.value})}
                    className="w-4 h-4"
                  />
                  <span>Híbrido</span>
                </label>
              </div>
            </div>

            {(formData.formato_evento === 'presencial' || formData.formato_evento === 'hibrido') && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    placeholder="São Paulo"
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Input
                      id="estado"
                      placeholder="SP"
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pais">País</Label>
                    <Input
                      id="pais"
                      placeholder="Brasil"
                      value={formData.pais}
                      onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Detalhes adicionais sobre o evento..."
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : evento ? "Atualizar" : "Criar Evento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
