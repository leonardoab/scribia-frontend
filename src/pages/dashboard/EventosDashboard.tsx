import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { eventosApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { EventList } from "@/components/dashboard/EventList";
import { EventForm } from "@/components/dashboard/EventForm";
import { Evento, EventoFormData } from "@/types/evento";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const EventosDashboard = () => {
  const { user } = useCustomAuth();
  const { toast } = useToast();
  
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventoToDelete, setEventoToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchEventos();
    }
  }, [user]);

  const fetchEventos = async () => {
    try {
      setLoading(true);
      const response = await eventosApi.list();
      // Backend retorna { statusCode, message, data: { perfil, total, eventos } }
      const backendData = response.data.data || response.data;
      const eventosData = backendData.eventos || backendData;
      setEventos(Array.isArray(eventosData) ? eventosData : []);
    } catch (error: any) {
      console.error('Erro ao buscar eventos:', error);
      setEventos([]);
      toast({
        title: "Erro ao carregar eventos",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (formData: EventoFormData) => {
    try {
      setFormLoading(true);

      if (editingEvento) {
        await eventosApi.update(editingEvento.id, formData);
        toast({
          title: "✅ Evento atualizado!",
          description: "As alterações foram salvas com sucesso.",
        });
      } else {
        await eventosApi.create(formData);
        toast({
          title: "✅ Evento criado com sucesso!",
          description: "Seu evento foi adicionado.",
        });
      }

      setFormOpen(false);
      setEditingEvento(null);
      fetchEventos();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar evento",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (evento: Evento) => {
    setEditingEvento(evento);
    setFormOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setEventoToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!eventoToDelete) return;

    try {
      await eventosApi.delete(eventoToDelete);

      toast({
        title: "🗑️ Evento excluído com sucesso!",
        description: "O evento foi removido.",
      });

      fetchEventos();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir evento",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setEventoToDelete(null);
    }
  };

  const handleNewEvent = () => {
    setEditingEvento(null);
    setFormOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Meus Eventos
          </h2>
          <p className="text-muted-foreground mt-1">
            Gerencie seus eventos e palestras
          </p>
        </div>
        <Button onClick={handleNewEvent} size="lg" className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-5 w-5" />
          Novo Evento
        </Button>
      </div>

      {/* Event List */}
      <EventList
        eventos={eventos}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        loading={loading}
      />

      {/* Event Form Dialog */}
      <EventForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingEvento(null);
        }}
        onSubmit={handleCreateOrUpdate}
        evento={editingEvento}
        loading={formLoading}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O evento será permanentemente excluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EventosDashboard;
