import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Video, Calendar, TrendingUp, Eye, Upload, Clock } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { statsService } from "../services";
import Layout from "../components/layout/Layout";
import { Card, Button, Badge } from "../components/ui";

const DashboardPage = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalVideos: 0,
    scheduledVideos: 0,
    publishedVideos: 0,
    totalViews: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const response = await statsService.getStats();
        if (response.success && response.data) {
          setStats(response.data);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: t("dashboard.stats.totalVideos"),
      value: stats.totalVideos,
      icon: Video,
      color: "text-primary-500",
      bgColor: "bg-primary-600/10",
    },
    {
      title: t("dashboard.stats.scheduled"),
      value: stats.scheduledVideos,
      icon: Clock,
      color: "text-blue-500",
      bgColor: "bg-blue-600/10",
    },
    {
      title: t("dashboard.stats.published"),
      value: stats.publishedVideos,
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-600/10",
    },
    {
      title: t("dashboard.stats.views"),
      value: stats.totalViews.toLocaleString(),
      icon: Eye,
      color: "text-purple-500",
      bgColor: "bg-purple-600/10",
    },
  ];

  return (
    <Layout>
      <div className="container-custom py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            {t("dashboard.welcome", { name: user?.name || "Usuario" })}
          </h1>
          <p className="text-gray-400">{t("dashboard.title")}</p>
        </div>

        {/* Plan Badge */}
        <div className="mb-8">
          <Badge variant={user?.plan === "free" ? "neutral" : "primary"}>
            {t(`plans.${user?.plan}.name`)} Plan
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <Card
              key={index}
              className={isLoading ? "animate-pulse" : "fade-in"}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-2">{stat.title}</p>
                  <p className="text-3xl font-bold text-white">
                    {isLoading ? "—" : stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            {t("dashboard.quickActions")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/videos/upload">
              <Card interactive className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 gradient-red rounded-2xl mb-4">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {t("videos.uploadNew")}
                </h3>
                <p className="text-gray-400 text-sm">
                  Sube un nuevo video a tu biblioteca
                </p>
              </Card>
            </Link>

            <Link to="/schedule">
              <Card interactive className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/20 border border-blue-600/30 rounded-2xl mb-4">
                  <Calendar className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {t("schedule.title")}
                </h3>
                <p className="text-gray-400 text-sm">
                  Programa tus videos para publicación
                </p>
              </Card>
            </Link>

            <Link to="/videos">
              <Card interactive className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600/20 border border-purple-600/30 rounded-2xl mb-4">
                  <Video className="w-8 h-8 text-purple-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {t("videos.title")}
                </h3>
                <p className="text-gray-400 text-sm">
                  Ver y gestionar todos tus videos
                </p>
              </Card>
            </Link>
          </div>
        </div>

        {/* Recent Videos Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">
              {t("dashboard.recentVideos")}
            </h2>
            <Link to="/videos">
              <Button variant="outline" size="sm">
                Ver todos
              </Button>
            </Link>
          </div>

          <Card>
            <div className="text-center py-12">
              <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">{t("videos.noVideos")}</p>
              <Link to="/videos/upload">
                <Button variant="primary">{t("videos.uploadFirst")}</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;
