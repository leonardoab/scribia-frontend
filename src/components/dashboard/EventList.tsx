import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Calendar, MapPin, Presentation } from "lucide-react";
import { Evento } from "@/types/evento";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EventListProps {
  eventos: Evento[];
  onEdit: (evento: Evento) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}

export function EventList({ eventos, onEdit, onDelete, loading }: EventListProps) {
  const navigate = useNavigate();
  
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-muted rounded w-full mb-2" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (eventos.length === 0) {
    return (
      <Card className="col-span-full">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum evento cadastrado</h3>
          <p className="text-muted-foreground text-center">
            Comece criando seu primeiro evento clicando no botão "+ Novo Evento"
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {eventos.map((evento) => (
        <Card key={evento.id} className="hover:shadow-lg transition-shadow flex flex-col h-full min-h-[340px]">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl mb-2 line-clamp-2">{evento.nome_evento}</CardTitle>
                {(evento.data_inicio || evento.data_fim) && (
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span className="line-clamp-1">
                      {evento.data_inicio && format(new Date(evento.data_inicio), "dd/MM/yyyy", { locale: ptBR })}
                      {evento.data_inicio && evento.data_fim && " - "}
                      {evento.data_fim && format(new Date(evento.data_fim), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </CardDescription>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 gap-4">
            <div className="space-y-3 flex-1">
              {(evento.formato_evento === 'presencial' || evento.formato_evento === 'hibrido') && (evento.cidade || evento.estado || evento.pais) && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">
                    {[evento.cidade, evento.estado, evento.pais].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
              {evento.formato_evento === 'remoto' && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Evento Remoto</span>
                </div>
              )}
              {evento.formato_evento === 'hibrido' && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Evento Híbrido</span>
                </div>
              )}
              
              {evento.observacoes && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {evento.observacoes}
                </p>
              )}
            </div>

            <div className="border-t pt-3" />

            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => navigate(`/dashboard/eventos/${evento.id}/palestras`)}
              >
                <Presentation className="h-4 w-4 mr-2" />
                Palestras
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onEdit(evento)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(evento.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
