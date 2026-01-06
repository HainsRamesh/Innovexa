import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import { Innovation, InnovationCategory, InnovationStatus } from '@/types';
import { toast } from 'sonner';

const InnovationEditPage = () => {
  const { innovationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    tagline: '',
    category: 'other' as InnovationCategory,
    description: '',
    cover_image_url: '',
    video_url: '',
    without_product: '',
    with_product: '',
    status: 'draft' as InnovationStatus,
  });

  const fromLocation = location.state?.from;

  useEffect(() => {
    if (innovationId) {
      fetchInnovation();
    }
  }, [innovationId]);

  const fetchInnovation = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('innovations')
        .select('*')
        .eq('id', innovationId)
        .single();

      if (error) throw error;
      
      const innovation = data as Innovation;
      setFormData({
        title: innovation.title,
        tagline: innovation.tagline,
        category: innovation.category,
        description: innovation.description,
        cover_image_url: innovation.cover_image_url,
        video_url: innovation.video_url || '',
        without_product: innovation.without_product,
        with_product: innovation.with_product,
        status: innovation.status,
      });
    } catch (error) {
      console.error('Error fetching innovation:', error);
      toast.error('Failed to load innovation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (fromLocation === 'overview') {
      navigate('/dashboard');
    } else if (fromLocation === 'my-innovations') {
      navigate('/dashboard/innovations');
    } else {
      navigate('/dashboard/innovations');
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.description || !formData.cover_image_url) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('innovations')
        .update({
          title: formData.title,
          tagline: formData.tagline,
          category: formData.category,
          description: formData.description,
          cover_image_url: formData.cover_image_url,
          video_url: formData.video_url || null,
          without_product: formData.without_product,
          with_product: formData.with_product,
          status: formData.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', innovationId);

      if (error) throw error;

      toast.success('Innovation updated successfully');
      handleBack();
    } catch (error) {
      console.error('Error updating innovation:', error);
      toast.error('Failed to update innovation');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Innovation title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={formData.tagline}
                  onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
                  placeholder="A brief tagline for your innovation"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value: InnovationCategory) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ai">AI & ML</SelectItem>
                      <SelectItem value="healthtech">HealthTech</SelectItem>
                      <SelectItem value="fintech">FinTech</SelectItem>
                      <SelectItem value="climatetech">ClimateTech</SelectItem>
                      <SelectItem value="edtech">EdTech</SelectItem>
                      <SelectItem value="saas">SaaS</SelectItem>
                      <SelectItem value="hardware">Hardware</SelectItem>
                      <SelectItem value="web3">Web3</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value: InnovationStatus) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your innovation in detail"
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cover_image_url">Cover Image URL *</Label>
                <Input
                  id="cover_image_url"
                  value={formData.cover_image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, cover_image_url: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="video_url">Video URL (YouTube/Vimeo)</Label>
                <Input
                  id="video_url"
                  value={formData.video_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
              {formData.cover_image_url && (
                <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                  <img 
                    src={formData.cover_image_url} 
                    alt="Cover preview" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Impact Statement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="without_product">Without the Product</Label>
                <Textarea
                  id="without_product"
                  value={formData.without_product}
                  onChange={(e) => setFormData(prev => ({ ...prev, without_product: e.target.value }))}
                  placeholder="Describe the problem users face without your product"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="with_product">With the Product</Label>
                <Textarea
                  id="with_product"
                  value={formData.with_product}
                  onChange={(e) => setFormData(prev => ({ ...prev, with_product: e.target.value }))}
                  placeholder="Describe how your product solves the problem"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InnovationEditPage;
