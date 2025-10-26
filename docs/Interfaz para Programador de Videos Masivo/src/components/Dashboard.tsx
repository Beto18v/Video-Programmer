import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Play,
  Search,
  Bell,
  Settings,
  LogOut,
  Video,
  Youtube,
  Plus,
  Calendar,
  Edit,
  Trash2,
  Clock,
  Eye,
  ThumbsUp,
  MessageSquare,
  MoreVertical,
  Upload,
  LayoutGrid,
  List
} from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [activeSection, setActiveSection] = useState<'videos' | 'canales'>('videos');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const videos = [
    {
      id: 1,
      title: "Tutorial de React - Hooks Avanzados",
      thumbnail: "https://images.unsplash.com/photo-1739296385442-a775d63e026c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aWRlbyUyMHByb2R1Y3Rpb24lMjB0ZWNobm9sb2d5fGVufDF8fHx8MTc2MTI4NzA3N3ww&ixlib=rb-4.1.0&q=80&w=400",
      status: "programado",
      scheduledDate: "2025-10-28 10:00",
      channel: "Mi Canal Tech",
      views: 1243,
      likes: 89,
      comments: 23,
      duration: "12:34"
    },
    {
      id: 2,
      title: "Cómo ganar dinero en YouTube 2025",
      thumbnail: "https://images.unsplash.com/photo-1673767297353-0a4c8ad61b05?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3V0dWJlJTIwY29udGVudCUyMGNyZWF0b3J8ZW58MXx8fHwxNzYxMzA1ODc3fDA&ixlib=rb-4.1.0&q=80&w=400",
      status: "publicado",
      publishedDate: "2025-10-20 15:30",
      channel: "Mi Canal Tech",
      views: 45231,
      likes: 3421,
      comments: 342,
      duration: "15:42"
    },
    {
      id: 3,
      title: "Top 10 herramientas de automatización",
      thumbnail: "https://images.unsplash.com/photo-1717386255767-52643970d483?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdXRvbWF0aW9uJTIwZGlnaXRhbHxlbnwxfHx8fDE3NjEzNjAxMTJ8MA&ixlib=rb-4.1.0&q=80&w=400",
      status: "borrador",
      channel: "Mi Canal Tech",
      duration: "18:20"
    },
    {
      id: 4,
      title: "Mi setup para crear contenido profesional",
      thumbnail: "https://images.unsplash.com/photo-1739296385442-a775d63e026c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aWRlbyUyMHByb2R1Y3Rpb24lMjB0ZWNobm9sb2d5fGVufDF8fHx8MTc2MTI4NzA3N3ww&ixlib=rb-4.1.0&q=80&w=400",
      status: "programado",
      scheduledDate: "2025-11-01 18:00",
      channel: "Canal Secundario",
      duration: "22:15"
    },
    {
      id: 5,
      title: "Guía completa de YouTube SEO",
      thumbnail: "https://images.unsplash.com/photo-1673767297353-0a4c8ad61b05?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3V0dWJlJTIwY29udGVudCUyMGNyZWF0b3J8ZW58MXx8fHwxNzYxMzA1ODc3fDA&ixlib=rb-4.1.0&q=80&w=400",
      status: "publicado",
      publishedDate: "2025-10-15 12:00",
      channel: "Mi Canal Tech",
      views: 32145,
      likes: 2341,
      comments: 198,
      duration: "25:30"
    },
    {
      id: 6,
      title: "Tendencias de contenido 2025",
      thumbnail: "https://images.unsplash.com/photo-1717386255767-52643970d483?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdXRvbWF0aW9uJTIwZGlnaXRhbHxlbnwxfHx8fDE3NjEzNjAxMTJ8MA&ixlib=rb-4.1.0&q=80&w=400",
      status: "programado",
      scheduledDate: "2025-10-30 14:00",
      channel: "Mi Canal Tech",
      duration: "14:55"
    }
  ];

  const channels = [
    {
      id: 1,
      name: "Mi Canal Tech",
      subscribers: "125K",
      avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=tech",
      totalVideos: 243,
      status: "activo"
    },
    {
      id: 2,
      name: "Canal Secundario",
      subscribers: "45K",
      avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=secondary",
      totalVideos: 89,
      status: "activo"
    },
    {
      id: 3,
      name: "Canal Vlogs",
      subscribers: "12K",
      avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=vlogs",
      totalVideos: 156,
      status: "activo"
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      programado: { label: 'Programado', className: 'bg-blue-600/20 text-blue-400 border-blue-600/30' },
      publicado: { label: 'Publicado', className: 'bg-green-600/20 text-green-400 border-green-600/30' },
      borrador: { label: 'Borrador', className: 'bg-gray-600/20 text-gray-400 border-gray-600/30' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Badge className={`${config.className} border`}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-800 bg-black/50 backdrop-blur-sm flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <Play className="w-6 h-6 fill-white" />
            </div>
            <div>
              <div className="text-sm">Programador</div>
              <div className="text-xs text-gray-400">Videos Masivo</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveSection('videos')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeSection === 'videos'
                ? 'bg-red-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <Video className="w-5 h-5" />
            <span>Videos</span>
            <Badge className="ml-auto bg-gray-800 text-gray-300 border-0">
              {videos.length}
            </Badge>
          </button>

          <button
            onClick={() => setActiveSection('canales')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeSection === 'canales'
                ? 'bg-red-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <Youtube className="w-5 h-5" />
            <span>Canales</span>
            <Badge className="ml-auto bg-gray-800 text-gray-300 border-0">
              {channels.length}
            </Badge>
          </button>

          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-all">
            <Calendar className="w-5 h-5" />
            <span>Calendario</span>
          </button>

          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-all">
            <Upload className="w-5 h-5" />
            <span>Subir Video</span>
          </button>
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-800 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-all">
            <Settings className="w-5 h-5" />
            <span>Configuración</span>
          </button>
          <button
            onClick={() => onNavigate('landing')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-gray-800 bg-black/50 backdrop-blur-sm">
          <div className="px-8 py-4 flex items-center justify-between">
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                  placeholder="Buscar videos, canales..."
                  className="pl-11 bg-gray-950 border-gray-800 focus:border-red-600 text-white placeholder:text-gray-600"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 ml-6">
              <Button variant="ghost" size="icon" className="relative hover:bg-gray-800">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full"></span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 hover:bg-gray-800 rounded-lg px-3 py-2 transition-all">
                    <Avatar>
                      <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=user" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <div className="text-sm">Juan Delgado</div>
                      <div className="text-xs text-gray-400">Plan Pro</div>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800">
                  <DropdownMenuItem className="hover:bg-gray-800">Perfil</DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-gray-800">Configuración</DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-gray-800">Facturación</DropdownMenuItem>
                  <DropdownMenuItem 
                    className="hover:bg-gray-800 text-red-400"
                    onClick={() => onNavigate('landing')}
                  >
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl mb-2">
                  {activeSection === 'videos' ? 'Mis Videos' : 'Mis Canales'}
                </h1>
                <p className="text-gray-400">
                  {activeSection === 'videos'
                    ? 'Gestiona y programa tus videos de YouTube'
                    : 'Administra todos tus canales conectados'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {activeSection === 'videos' && (
                  <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg p-1">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className={viewMode === 'grid' ? 'bg-red-600 hover:bg-red-700' : 'hover:bg-gray-800'}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className={viewMode === 'list' ? 'bg-red-600 hover:bg-red-700' : 'hover:bg-gray-800'}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <Button className="bg-red-600 hover:bg-red-700">
                  <Plus className="w-4 h-4 mr-2" />
                  {activeSection === 'videos' ? 'Nuevo Video' : 'Conectar Canal'}
                </Button>
              </div>
            </div>

            {/* Videos Grid */}
            {activeSection === 'videos' && (
              <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                {videos.map((video) => (
                  <div
                    key={video.id}
                    className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-xl overflow-hidden hover:border-red-600/50 transition-all group"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-gray-950">
                      <ImageWithFallback
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs">
                        {video.duration}
                      </div>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-12 h-12 text-white fill-white" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg line-clamp-2 flex-1">{video.title}</h3>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="flex-shrink-0 hover:bg-gray-800">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-gray-900 border-gray-800">
                            <DropdownMenuItem className="hover:bg-gray-800">
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="hover:bg-gray-800">
                              <Calendar className="w-4 h-4 mr-2" />
                              Reprogramar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="hover:bg-gray-800 text-red-400">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(video.status)}
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-400">{video.channel}</span>
                        </div>

                        {video.status === 'programado' && video.scheduledDate && (
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Clock className="w-4 h-4" />
                            <span>{video.scheduledDate}</span>
                          </div>
                        )}

                        {video.status === 'publicado' && (
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              <span>{video.views?.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <ThumbsUp className="w-4 h-4" />
                              <span>{video.likes?.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-4 h-4" />
                              <span>{video.comments}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" className="flex-1 border-gray-800 hover:bg-gray-800">
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 border-gray-800 hover:bg-gray-800">
                          <Calendar className="w-4 h-4 mr-2" />
                          Programar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Channels List */}
            {activeSection === 'canales' && (
              <div className="grid gap-6">
                {channels.map((channel) => (
                  <div
                    key={channel.id}
                    className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-xl p-6 hover:border-red-600/50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={channel.avatar} />
                          <AvatarFallback>{channel.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-xl mb-1">{channel.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span>{channel.subscribers} suscriptores</span>
                            <span>•</span>
                            <span>{channel.totalVideos} videos</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge className="bg-green-600/20 text-green-400 border border-green-600/30">
                          {channel.status}
                        </Badge>
                        <Button variant="outline" className="border-gray-800 hover:bg-gray-800">
                          <Settings className="w-4 h-4 mr-2" />
                          Configurar
                        </Button>
                        <Button className="bg-red-600 hover:bg-red-700">
                          <Upload className="w-4 h-4 mr-2" />
                          Subir Video
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
