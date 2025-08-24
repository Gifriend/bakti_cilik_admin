'use client';

import { useState, useEffect } from 'react';
import {
  type ChildInfo,
  growthApi,
  type GrowthChartData,
  type GrowthStats,
} from '@/app/service/growth-api';
import { GrowthChart } from './GrowthChart';
import { GrowthStatsCard } from './GrowthStatsCard';
import ChildGrowthList from '@/components/ChildGrowthList';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Baby,
  Users,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserMenu } from '@/components/UserMenu';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { PWAStatus } from '@/components/PWAStatus';
import { getCookieValue } from '@/app/service/api';

// Define local storage keys
const LOCAL_STORAGE_KEYS = {
  CHILDREN: 'growthTracker_children',
  CHART_DATA: 'growthTracker_chartData_',
  STATS_DATA: 'growthTracker_statsData_',
};

export default function GrowthStatsPage() {
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [selectedView, setSelectedView] = useState<'all' | number>('all');
  const [allChildrenData, setAllChildrenData] = useState<{
    [childId: number]: GrowthChartData;
  }>({});
  const [allChildrenStats, setAllChildrenStats] = useState<{
    [childId: number]: GrowthStats;
  }>({});
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noChildFound, setNoChildFound] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  // Load data from local storage
  const loadFromLocalStorage = <T,>(key: string): T | null => {
    if (typeof window === 'undefined') return null;

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error loading from local storage (${key}):`, error);
      return null;
    }
  };

  // Save data to local storage
  const saveToLocalStorage = (key: string, data: any): void => {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving to local storage (${key}):`, error);
    }
  };

  // Clear specific data from local storage
  const clearLocalStorageData = (key: string): void => {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error clearing local storage (${key}):`, error);
    }
  };

  // Load user's children and their data
  const loadChildren = async () => {
    try {
      setLoading(true);
      setError(null);
      setAccessDenied(false);

      console.log('🚀 Loading children data...');

      const token =
        getCookieValue('access_token') || localStorage.getItem('authToken');
      if (!token) {
        console.error('❌ No authentication token found');
        setAccessDenied(true);
        return;
      }

      // Try to load from local storage first
      const storedChildren = loadFromLocalStorage<ChildInfo[]>(
        LOCAL_STORAGE_KEYS.CHILDREN
      );
      if (storedChildren && storedChildren.length > 0) {
        console.log('✅ Using children data from local storage');
        setChildren(storedChildren);
        setSelectedView('all');
        await loadAllChildrenData(storedChildren);

        // Continue to fetch fresh data in the background
        fetchFreshChildrenData();
        return;
      }

      // If no data in local storage, fetch from API
      await fetchFreshChildrenData();
    } catch (error: any) {
      console.error('❌ Error loading children:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      const errorMessage = error.message || 'Gagal memuat data anak';

      if (errorMessage.includes('401') || errorMessage.includes('403')) {
        setAccessDenied(true);
      } else {
        setError(errorMessage);
      }

      setChildren([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch fresh children data from API
  const fetchFreshChildrenData = async () => {
    try {
      const childrenResponse = await growthApi.getMyChildrenUsers();
      console.log('🔍 Raw children response:', childrenResponse);
      console.log('🔍 Response type:', typeof childrenResponse);
      console.log('🔍 Is array:', Array.isArray(childrenResponse));

      // Handle different response formats
      let childrenData: ChildInfo[] = [];

      if (Array.isArray(childrenResponse)) {
        // Direct array response
        childrenData = childrenResponse;
        console.log('✅ Using direct array response');
      } else if (childrenResponse && typeof childrenResponse === 'object') {
        // Check if it's wrapped in a data property
        if ('data' in childrenResponse && Array.isArray(childrenResponse)) {
          childrenData = childrenResponse;
          console.log('✅ Using response.data array');
        } else if (
          'children' in childrenResponse &&
          Array.isArray(childrenResponse)
        ) {
          childrenData = childrenResponse;
          console.log('✅ Using response.children array');
        } else {
          console.warn('⚠️ Unexpected response format:', childrenResponse);
          childrenData = [];
        }
      }

      console.log('✅ Processed children data:', childrenData);
      console.log('✅ Children count:', childrenData.length);

      if (childrenData.length === 0) {
        console.log('ℹ️ No children found for user');
        setNoChildFound(true);
        setChildren([]);
        // Clear any stale data from local storage
        clearLocalStorageData(LOCAL_STORAGE_KEYS.CHILDREN);
      } else {
        console.log(
          '🎯 Setting children data:',
          childrenData.map((c) => ({ id: c.id, name: c.name }))
        );
        setChildren(childrenData);
        setSelectedView('all');

        // Save to local storage
        saveToLocalStorage(LOCAL_STORAGE_KEYS.CHILDREN, childrenData);

        // Load data for all children
        await loadAllChildrenData(childrenData);
      }
    } catch (error) {
      console.error('❌ Error fetching fresh children data:', error);
      throw error; // Re-throw to be handled by the calling function
    }
  };

  // Load data for all children
  const loadAllChildrenData = async (childrenList: ChildInfo[]) => {
    setLoadingData(true);
    const allData: { [childId: number]: GrowthChartData } = {};
    const allStats: { [childId: number]: GrowthStats } = {};

    console.log('🚀 Loading data for all children...');

    // Default GrowthStats object to use as fallback
    const defaultGrowthStats: GrowthStats = {
      _count: { _all: 0 },
      _avg: { height: 0, weight: 0, heightZScore: 0 },
      _min: {
        date: '',
        height: 0,
        weight: 0,
        heightZScore: 0,
      },
      _max: {
        date: '',
        height: 0,
        weight: 0,
        heightZScore: 0,
      },
    };

    for (const child of childrenList) {
      try {
        console.log(`📊 Loading data for ${child.name} (ID: ${child.id})`);

        // Always fetch fresh data from API
        const [chartData, statsData] = await Promise.all([
          growthApi.getGrowthChart(child.id),
          growthApi.getGrowthStats(child.id),
        ]);

        // Store the fetched data
        allData[child.id] = chartData;
        allStats[child.id] = statsData;

        // Save to local storage for offline use
        saveToLocalStorage(
          `${LOCAL_STORAGE_KEYS.CHART_DATA}${child.id}`,
          chartData
        );
        saveToLocalStorage(
          `${LOCAL_STORAGE_KEYS.STATS_DATA}${child.id}`,
          statsData
        );

        console.log(`✅ Chart and stats data loaded for ${child.name}`);
      } catch (error) {
        console.error(`❌ Error loading data for child ${child.id}:`, error);

        // Fallback to local storage if API call fails
        const storedChartData = loadFromLocalStorage<GrowthChartData>(
          `${LOCAL_STORAGE_KEYS.CHART_DATA}${child.id}`
        );
        const storedStatsData = loadFromLocalStorage<GrowthStats>(
          `${LOCAL_STORAGE_KEYS.STATS_DATA}${child.id}`
        );

        allData[child.id] = storedChartData || { records: [], whoCurves: [] };
        allStats[child.id] = storedStatsData || defaultGrowthStats;

        console.log(
          storedChartData || storedStatsData
            ? `✅ Fallback to local storage for ${child.name}`
            : `⚠️ Using default data for ${child.name}`
        );
      }
    }

    setAllChildrenData(allData);
    setAllChildrenStats(allStats);
    setLoadingData(false);
    console.log('✅ All children data loaded');
  };

  // Handle view selection change
  const handleViewChange = (value: string) => {
    const newView = value === 'all' ? 'all' : Number.parseInt(value);
    console.log('🎯 View changed to:', newView);
    setSelectedView(newView);
  };

  // Fetch data on component mount
  useEffect(() => {
    loadChildren();
  }, []);

  const handleRetry = () => {
    // Clear local storage and reload
    clearLocalStorageData(LOCAL_STORAGE_KEYS.CHILDREN);
    children.forEach((child) => {
      clearLocalStorageData(`${LOCAL_STORAGE_KEYS.CHART_DATA}${child.id}`);
      clearLocalStorageData(`${LOCAL_STORAGE_KEYS.STATS_DATA}${child.id}`);
    });
    loadChildren();
  };

  // Get current view data
  const getCurrentViewData = () => {
    if (selectedView === 'all') {
      return {
        children: children,
        allData: allChildrenData,
        allStats: allChildrenStats,
      };
    } else {
      const selectedChild = children.find((child) => child.id === selectedView);
      return {
        child: selectedChild,
        data: allChildrenData[selectedView as number],
        stats: allChildrenStats[selectedView as number],
      };
    }
  };

  const currentViewData = getCurrentViewData();

  // Show loading on initial load
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Memuat data anak...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Statistik Pertumbuhan
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Visualisasi data pertumbuhan anak
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end">
              <UserMenu />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="shadow-lg border-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="ml-4 bg-transparent">
                <RefreshCw className="h-4 w-4 mr-2" />
                Coba Lagi
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Access Denied State */}
        {accessDenied && (
          <Card className="text-center py-16 shadow-xl border-0 bg-gradient-to-br from-red-50 to-pink-50">
            <CardHeader>
              <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="h-10 w-10 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-800">
                Akses Ditolak
              </CardTitle>
              <CardDescription className="max-w-md mx-auto text-red-600">
                Anda tidak memiliki akses untuk melihat data pertumbuhan ini.
                Pastikan Anda sudah login dengan akun yang benar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => (window.location.href = '/login')}
                className="shadow-lg bg-red-600 hover:bg-red-700">
                Login Ulang
              </Button>
            </CardContent>
          </Card>
        )}

        {/* No Children Found */}
        {noChildFound && (
          <Card className="text-center py-16 shadow-xl border-0 bg-gradient-to-br from-yellow-50 to-orange-50">
            <CardHeader>
              <div className="mx-auto w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
                <Baby className="h-10 w-10 text-yellow-600" />
              </div>
              <CardTitle className="text-2xl text-yellow-800">
                Belum Ada Data Anak
              </CardTitle>
              <CardDescription className="max-w-md mx-auto text-yellow-700">
                Belum ada data anak yang terdaftar untuk akun Anda. Silakan
                hubungi petugas kesehatan untuk mendaftarkan anak.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* View Selection - Show if user has children */}
        {children.length > 0 && (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Pilih Tampilan Data
              </CardTitle>
              <CardDescription>
                Pilih untuk melihat data semua anak atau anak tertentu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="viewSelect" className="text-sm font-medium">
                  Tampilan yang dipilih:
                </Label>
                <Select
                  value={selectedView.toString()}
                  onValueChange={handleViewChange}>
                  <SelectTrigger className="w-full max-w-md">
                    <SelectValue placeholder="Pilih tampilan..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-purple-500" />
                        <span>Semua Anak ({children.length})</span>
                      </div>
                    </SelectItem>
                    {children.map((child) => (
                      <SelectItem key={child.id} value={child.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Baby
                            className={`h-4 w-4 ${child.gender === 'MALE' ? 'text-blue-500' : 'text-pink-500'}`}
                          />
                          <span>{child.name}</span>
                          <span className="text-sm text-gray-500">
                            (
                            {child.gender === 'MALE'
                              ? 'Laki-laki'
                              : 'Perempuan'}
                            )
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        {children.length > 0 && (
          <div className="space-y-8">
            {loadingData ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
                <span className="text-gray-600">
                  Memuat data pertumbuhan...
                </span>
              </div>
            ) : (
              <div>
                {/* All Children View */}
                {selectedView === 'all' && (
                  <div className="space-y-8">
                    {/* Overview Stats for All Children */}
                    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                      <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg p-4 sm:p-6">
                        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                          <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span>Ringkasan Semua Anak ({children.length})</span>
                        </CardTitle>
                        <CardDescription className="text-purple-100 text-sm sm:text-base">
                          Data pertumbuhan untuk semua anak yang terdaftar
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {children.map((child) => {
                            const childData = allChildrenData[child.id];
                            const childStats = allChildrenStats[child.id];
                            const latestRecord =
                              childData?.records?.[
                                childData.records.length - 1
                              ];

                            return (
                              <Card
                                key={child.id}
                                className="bg-gradient-to-br from-gray-50 to-white border border-gray-200">
                                <CardContent className="p-4">
                                  <div className="flex items-center gap-3 mb-3">
                                    <Baby
                                      className={`h-5 w-5 ${child.gender === 'MALE' ? 'text-blue-500' : 'text-pink-500'}`}
                                    />
                                    <div>
                                      <h4 className="font-semibold text-gray-900">
                                        {child.name}
                                      </h4>
                                      <p className="text-xs text-gray-500">
                                        {child.gender === 'MALE'
                                          ? 'Laki-laki'
                                          : 'Perempuan'}
                                      </p>
                                    </div>
                                  </div>

                                  {latestRecord ? (
                                    <div className="space-y-2">
                                      <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="bg-blue-50 p-2 rounded">
                                          <div className="text-xs text-blue-600 font-medium">
                                            Tinggi
                                          </div>
                                          <div className="text-blue-800 font-semibold">
                                            {latestRecord.height} cm
                                          </div>
                                        </div>
                                        <div className="bg-green-50 p-2 rounded">
                                          <div className="text-xs text-green-600 font-medium">
                                            Berat
                                          </div>
                                          <div className="text-green-800 font-semibold">
                                            {latestRecord.weight} kg
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        Total pengukuran:{' '}
                                        {childData?.records?.length || 0}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-center py-4">
                                      <div className="text-gray-400 text-xs">
                                        Belum ada data
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Combined Charts for All Children */}
                    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg p-4 sm:p-6">
                        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span>Grafik Perbandingan Semua Anak</span>
                        </CardTitle>
                        <CardDescription className="text-blue-100 text-sm sm:text-base">
                          Visualisasi pertumbuhan semua anak dalam satu grafik
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6">
                        <Tabs defaultValue="height" className="w-full">
                          <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6">
                            <TabsTrigger
                              value="height"
                              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm">
                              Tinggi Badan
                            </TabsTrigger>
                            <TabsTrigger
                              value="weight"
                              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm">
                              Berat Badan
                            </TabsTrigger>
                          </TabsList>
                          <TabsContent value="height" className="space-y-4">
                            {children.map((child) => {
                              const childData = allChildrenData[child.id];
                              if (childData && childData.records.length > 0) {
                                return (
                                  <div key={child.id} className="mb-6">
                                    <GrowthChart
                                      data={childData}
                                      childName={child.name}
                                      chartType="height"
                                    />
                                  </div>
                                );
                              }
                              return null;
                            })}
                          </TabsContent>
                          <TabsContent value="weight" className="space-y-4">
                            {children.map((child) => {
                              const childData = allChildrenData[child.id];
                              if (childData && childData.records.length > 0) {
                                return (
                                  <div key={child.id} className="mb-6">
                                    <GrowthChart
                                      data={childData}
                                      childName={child.name}
                                      chartType="weight"
                                    />
                                  </div>
                                );
                              }
                              return null;
                            })}
                          </TabsContent>
                        </Tabs>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Individual Child View */}
                {selectedView !== 'all' && currentViewData.child && (
                  <div className="space-y-8">
                    {/* Individual Child Stats */}
                    <GrowthStatsCard
                      childName={currentViewData.child.name}
                      stats={currentViewData.stats}
                      latestRecord={
                        currentViewData.data?.records?.[
                          currentViewData.data.records.length - 1
                        ]
                      }
                    />

                    {/* Individual Child Records */}
                    <ChildGrowthList
                      childId={currentViewData.child.id}
                      childName={currentViewData.child.name}
                    />

                    {/* Individual Child Charts */}
                    {currentViewData.data &&
                    currentViewData.data.records.length > 0 ? (
                      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg p-4 sm:p-6">
                          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="truncate">
                              Grafik - {currentViewData.child.name}
                            </span>
                          </CardTitle>
                          <CardDescription className="text-blue-100 text-sm sm:text-base">
                            Visualisasi perkembangan dengan kurva WHO
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6">
                          <Tabs defaultValue="height" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6">
                              <TabsTrigger
                                value="height"
                                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm">
                                Tinggi Badan
                              </TabsTrigger>
                              <TabsTrigger
                                value="weight"
                                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm">
                                Berat Badan
                              </TabsTrigger>
                            </TabsList>
                            <TabsContent value="height" className="space-y-4">
                              <GrowthChart
                                data={currentViewData.data}
                                childName={currentViewData.child.name}
                                chartType="height"
                              />
                            </TabsContent>
                            <TabsContent value="weight" className="space-y-4">
                              <GrowthChart
                                data={currentViewData.data}
                                childName={currentViewData.child.name}
                                chartType="weight"
                              />
                            </TabsContent>
                          </Tabs>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="text-center py-16 shadow-xl border-0 bg-gradient-to-br from-yellow-50 to-orange-50">
                        <CardHeader>
                          <div className="mx-auto w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
                            <TrendingUp className="h-10 w-10 text-yellow-600" />
                          </div>
                          <CardTitle className="text-2xl text-yellow-800">
                            Belum Ada Data Pengukuran
                          </CardTitle>
                          <CardDescription className="max-w-lg mx-auto text-yellow-700">
                            Data pengukuran pertumbuhan untuk{' '}
                            {currentViewData.child.name} belum tersedia.
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* PWA Status */}
      <PWAStatus />
    </div>
  );
}
