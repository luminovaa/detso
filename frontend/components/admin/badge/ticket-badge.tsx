import { Badge } from "@/components/ui/badge";

export const TicketStatusBadge = ({ status }: { status?: string }) => {
  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'open':
      case 'baru':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress':
      case 'dalam_proses':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resolved':
      case 'selesai':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'closed':
      case 'ditutup':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <Badge 
      variant="outline" 
      className={`${getStatusColor(status)} font-medium`}
    >
      {status || 'Unknown'}
    </Badge>
  );
};

// Priority Badge Component
export const PriorityBadge = ({ priority }: { priority?: string }) => {
  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
      case 'tinggi':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
      case 'sedang':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low':
      case 'rendah':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <Badge 
      variant="outline" 
      className={`${getPriorityColor(priority)} font-medium`}
    >
      {priority || 'Normal'}
    </Badge>
  );
};


export const TypeBadge = ({ type }: { type?: string }) => {
  const getTypeColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'downgrade':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'upgrade':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'problem':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <Badge 
      variant="outline" 
      className={`${getTypeColor(type)} font-medium`}
    >
      {type || 'Unknown'}
    </Badge>
  );
};