import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Calendar, MapPin, BookOpen, Mic, Eye, Edit } from "lucide-react";
import { Evento } from "@/types/evento";

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Em andamento':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Agendado':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Concluído':
        return 'bg-muted text-muted-foreground border-border';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Em andamento':
        return '🟢';
      case 'Agendado':
        return '🔵';
      case 'Concluído':
        return '⚪';
      default:
        return '⚪';
    }
  };

  const formatPeriodo = (dataInicio: string, dataFim: string) => {
    const inicio = new Date(dataInicio).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    const fim = new Date(dataFim).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    return dataInicio === dataFim ? inicio : `${inicio} - ${fim}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {eventos.map((evento) => {
        const now = new Date();
        const dataInicio = evento.data_inicio ? new Date(evento.data_inicio) : null;
        const dataFim = evento.data_fim ? new Date(evento.data_fim) : null;
        
        let status = 'Agendado';
        if (dataInicio && dataFim) {
          if (now >= dataInicio && now <= dataFim) {
            status = 'Em andamento';
          } else if (now > dataFim) {
            status = 'Concluído';
          }
        }

        return (
          <Card key={evento.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2">{evento.nome_evento}</CardTitle>
                  <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                    {(evento.data_inicio || evento.data_fim) && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatPeriodo(evento.data_inicio, evento.data_fim)}</span>
                      </div>
                    )}
                    {(evento.formato_evento === 'presencial' || evento.formato_evento === 'hibrido') && evento.cidade && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{evento.cidade}, {evento.estado}, {evento.pais}</span>
                      </div>
                    )}
                    {evento.formato_evento === 'remoto' && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>Evento Remoto</span>
                      </div>
                    )}
                  </div>
                </div>
                <Badge className={getStatusColor(status)}>
                  {getStatusIcon(status)} {status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div 
                  className="text-center p-3 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors"
                  onClick={() => navigate(`/dashboard/eventos/${evento.id}/palestras`)}
                >
                  <Mic className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-purple-600">{evento.palestras || 0}</p>
                  <p className="text-xs text-gray-600">Palestras</p>
                </div>
                <div 
                  className="text-center p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => navigate(`/dashboard/livebooks`)}
                >
                  <BookOpen className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-blue-600">{evento.livebooks || 0}</p>
                  <p className="text-xs text-gray-600">Livebooks</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-50"
                  onClick={() => navigate(`/dashboard/eventos/${evento.id}/palestras`)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Detalhes
                </Button>
                {evento.is_owner !== false && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-blue-200 text-blue-700 hover:bg-blue-50"
                      onClick={() => onEdit(evento)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-red-200 text-red-700 hover:bg-red-50"
                      onClick={() => onDelete(evento.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
