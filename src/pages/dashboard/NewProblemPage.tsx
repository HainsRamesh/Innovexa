import { useState, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useGlobalOverlay } from '@/contexts/GlobalOverlayContext';
import { ArrowLeft, Plus, X, Save, Send, AlertCircle } from 'lucide-react';
import { ProblemCategory, ProblemStatus } from '@/types';
import { z } from 'zod';
import { cn } from '@/lib/utils';

// Strict validation schema for publishing
const publishSchema = z.object({
  title: z
    .string()
    .min(10, 'Title must be at least 10 characters')
    .max(120, 'Title must be at most 120 characters'),
  description: z
    .string()
    .min(50, 'Description must be at least 50 characters')
    .max(5000, 'Description must be at most 5000 characters'),
  category: z.enum(
    ['technology', 'healthcare', 'sustainability', 'finance', 'education', 'infrastructure', 'manufacturing', 'agriculture', 'other'] as const,
    { required_error: 'Category is required' }
  ),
  industry: z
    .string()
    .min(1, 'Industry is required')
    .max(100, 'Industry must be at most 100 characters'),
  budgetMin: z
    .number({ required_error: 'Minimum budget is required', invalid_type_error: 'Minimum budget must be a number' })
    .min(1, 'Minimum budget must be at least $1'),
  budgetMax: z
    .number({ required_error: 'Maximum budget is required', invalid_type_error: 'Maximum budget must be a number' })
    .min(1, 'Maximum budget must be at least $1'),
  deadline: z
    .string()
    .min(1, 'Deadline is required'),
  requirements: z
    .array(z.string().min(5, 'Each requirement must be at least 5 characters'))
    .min(1, 'At least 1 requirement is required'),
  tags: z
    .array(z.string().min(2, 'Each tag must be at least 2 characters'))
    .min(1, 'At least 1 tag is required')
    .max(10, 'Maximum 10 tags allowed'),
}).refine((data) => data.budgetMax >= data.budgetMin, {
  message: 'Maximum budget must be greater than or equal to minimum budget',
  path: ['budgetMax'],
}).refine((data) => {
  const deadlineDate = new Date(data.deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return deadlineDate > today;
}, {
  message: 'Deadline must be a future date',
  path: ['deadline'],
});

// Relaxed schema for draft (only basic validation)
const draftSchema = z.object({
  title: z.string().min(1, 'Title is required for draft').max(120),
  description: z.string().max(5000).optional(),
  category: z.enum(['technology', 'healthcare', 'sustainability', 'finance', 'education', 'infrastructure', 'manufacturing', 'agriculture', 'other'] as const),
  industry: z.string().max(100).optional(),
  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional(),
  deadline: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

// Field order for scrolling to first error
const fieldOrder = ['title', 'description', 'category', 'industry', 'budgetMin', 'budgetMax', 'deadline', 'requirements', 'tags'];

const NewProblemPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { showOverlay, setOverlayStatus, hideOverlay } = useGlobalOverlay();
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<string | undefined>();
  const [pendingStatus, setPendingStatus] = useState<ProblemStatus | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Refs for scrolling to first error
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '' as ProblemCategory | '',
    industry: '',
    budgetMin: '',
    budgetMax: '',
    deadline: '',
    requirements: [] as string[],
    tags: [] as string[],
  });

  const [newRequirement, setNewRequirement] = useState('');
  const [newTag, setNewTag] = useState('');
  const [requirementError, setRequirementError] = useState('');
  const [tagError, setTagError] = useState('');

  const addRequirement = () => {
    const trimmed = newRequirement.trim();
    if (!trimmed) {
      setRequirementError('Requirement cannot be empty');
      return;
    }
    if (trimmed.length < 5) {
      setRequirementError('Requirement must be at least 5 characters');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      requirements: [...prev.requirements, trimmed],
    }));
    setNewRequirement('');
    setRequirementError('');
    // Clear requirements error if we now have at least one
    if (errors.requirements) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated.requirements;
        return updated;
      });
    }
  };

  const removeRequirement = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index),
    }));
  };

  const addTag = () => {
    const trimmed = newTag.trim().toLowerCase();
    if (!trimmed) {
      setTagError('Tag cannot be empty');
      return;
    }
    if (trimmed.length < 2) {
      setTagError('Tag must be at least 2 characters');
      return;
    }
    if (formData.tags.includes(trimmed)) {
      setTagError('This tag already exists');
      return;
    }
    if (formData.tags.length >= 10) {
      setTagError('Maximum 10 tags allowed');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      tags: [...prev.tags, trimmed],
    }));
    setNewTag('');
    setTagError('');
    // Clear tags error if we now have at least one
    if (errors.tags) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated.tags;
        return updated;
      });
    }
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const getFormDataForValidation = () => ({
    ...formData,
    category: formData.category || undefined,
    budgetMin: formData.budgetMin ? parseFloat(formData.budgetMin) : undefined,
    budgetMax: formData.budgetMax ? parseFloat(formData.budgetMax) : undefined,
  });

  const validateForm = (forPublish: boolean): boolean => {
    const schema = forPublish ? publishSchema : draftSchema;
    const dataToValidate = getFormDataForValidation();

    try {
      schema.parse(dataToValidate);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path[0] as string;
          if (path && !newErrors[path]) {
            newErrors[path] = err.message;
          }
        });
        setErrors(newErrors);

        // Scroll to first error field
        if (forPublish) {
          const firstErrorField = fieldOrder.find((field) => newErrors[field]);
          if (firstErrorField && fieldRefs.current[firstErrorField]) {
            fieldRefs.current[firstErrorField]?.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
            // Focus the input if possible
            const input = fieldRefs.current[firstErrorField]?.querySelector('input, textarea, button');
            if (input instanceof HTMLElement) {
              setTimeout(() => input.focus(), 300);
            }
          }
        }
      }
      return false;
    }
  };

  // Check if form is valid for publishing (used to disable button)
  const isFormValidForPublish = (): boolean => {
    const dataToValidate = getFormDataForValidation();
    try {
      publishSchema.parse(dataToValidate);
      return true;
    } catch {
      return false;
    }
  };

  const performSubmission = useCallback(async (status: ProblemStatus) => {
    try {
      const { error } = await supabase.from('problems').insert({
        owner_id: user!.id,
        title: formData.title,
        description: formData.description,
        category: formData.category as ProblemCategory,
        industry: formData.industry || null,
        budget_min: formData.budgetMin ? parseFloat(formData.budgetMin) : null,
        budget_max: formData.budgetMax ? parseFloat(formData.budgetMax) : null,
        deadline: formData.deadline || null,
        requirements: formData.requirements.length > 0 ? formData.requirements : null,
        tags: formData.tags.length > 0 ? formData.tags : null,
        status,
      });

      if (error) throw error;

      // Success
      setOverlayStatus("success");
      
      setTimeout(() => {
        hideOverlay();
        setIsLoading(false);
        toast({
          title: status === 'draft' ? 'Draft saved' : 'Problem published successfully',
          description:
            status === 'draft'
              ? 'Your problem has been saved as a draft.'
              : 'Your problem is now live and visible to innovators.',
        });
        navigate('/dashboard/problems');
      }, 600);
    } catch (error) {
      console.error('Error creating problem:', error);
      setLastError('Failed to save problem. Please try again.');
      setOverlayStatus("error");
    }
  }, [user, formData, toast, navigate, setOverlayStatus, hideOverlay]);

  const handleSubmit = async (status: ProblemStatus) => {
    const forPublish = status !== 'draft';
    if (!validateForm(forPublish)) {
      if (forPublish) {
        toast({
          title: 'Validation Error',
          description: 'Please fix the errors in the form before publishing.',
          variant: 'destructive',
        });
      }
      return;
    }

    setPendingStatus(status);
    setIsLoading(true);
    setLastError(undefined);

    // Show global overlay immediately
    showOverlay({
      mode: "submitting",
      type: "problem",
    });

    await performSubmission(status);
  };

  const handleRetry = useCallback(() => {
    if (pendingStatus) {
      showOverlay({
        mode: "submitting",
        type: "problem",
      });
      performSubmission(pendingStatus);
    }
  }, [pendingStatus, performSubmission, showOverlay]);

  const handleCloseOverlay = useCallback(() => {
    hideOverlay();
    setIsLoading(false);
    setPendingStatus(null);
  }, [hideOverlay]);

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const getFieldError = (field: string) => {
    return errors[field];
  };

  const hasError = (field: string) => {
    return !!errors[field];
  };

  const inputErrorClasses = (field: string) =>
    cn(
      hasError(field) && 'border-destructive ring-1 ring-destructive/50 focus-visible:ring-destructive/50'
    );

  const isPublishDisabled = !isFormValidForPublish() || isLoading;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/dashboard/problems">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Post New Problem</h1>
          <p className="text-muted-foreground">Describe your challenge to attract innovative solutions</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Provide the essential details about your problem</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2" ref={(el) => (fieldRefs.current.title = el)}>
              <Label htmlFor="title">
                Problem Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g., Reducing Carbon Emissions in Urban Transportation"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                onBlur={() => handleBlur('title')}
                className={inputErrorClasses('title')}
                maxLength={120}
              />
              <div className="flex justify-between items-start">
                {hasError('title') ? (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {getFieldError('title')}
                  </p>
                ) : (
                  <span />
                )}
                <p className="text-xs text-muted-foreground">
                  {formData.title.length}/120
                </p>
              </div>
            </div>

            <div className="space-y-2" ref={(el) => (fieldRefs.current.description = el)}>
              <Label htmlFor="description">
                Detailed Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Describe the problem in detail. Include context, current challenges, and what success looks like..."
                rows={8}
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                onBlur={() => handleBlur('description')}
                className={inputErrorClasses('description')}
                maxLength={5000}
              />
              <div className="flex justify-between items-start">
                {hasError('description') ? (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {getFieldError('description')}
                  </p>
                ) : (
                  <span />
                )}
                <p className="text-xs text-muted-foreground">
                  {formData.description.length}/5000 characters (min 50)
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2" ref={(el) => (fieldRefs.current.category = el)}>
                <Label htmlFor="category">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value as ProblemCategory }))}
                >
                  <SelectTrigger className={inputErrorClasses('category')}>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="sustainability">Sustainability</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="infrastructure">Infrastructure</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="agriculture">Agriculture</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {hasError('category') && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {getFieldError('category')}
                  </p>
                )}
              </div>

              <div className="space-y-2" ref={(el) => (fieldRefs.current.industry = el)}>
                <Label htmlFor="industry">
                  Industry <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="industry"
                  placeholder="e.g., Automotive, Healthcare IT"
                  value={formData.industry}
                  onChange={(e) => setFormData((prev) => ({ ...prev, industry: e.target.value }))}
                  onBlur={() => handleBlur('industry')}
                  className={inputErrorClasses('industry')}
                  maxLength={100}
                />
                {hasError('industry') && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {getFieldError('industry')}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget & Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Budget & Timeline</CardTitle>
            <CardDescription>Set expectations for solution providers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2" ref={(el) => (fieldRefs.current.budgetMin = el)}>
                <Label htmlFor="budgetMin">
                  Minimum Budget ($) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="budgetMin"
                  type="number"
                  placeholder="1000"
                  min={1}
                  value={formData.budgetMin}
                  onChange={(e) => setFormData((prev) => ({ ...prev, budgetMin: e.target.value }))}
                  onBlur={() => handleBlur('budgetMin')}
                  className={inputErrorClasses('budgetMin')}
                />
                {hasError('budgetMin') && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {getFieldError('budgetMin')}
                  </p>
                )}
              </div>
              <div className="space-y-2" ref={(el) => (fieldRefs.current.budgetMax = el)}>
                <Label htmlFor="budgetMax">
                  Maximum Budget ($) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="budgetMax"
                  type="number"
                  placeholder="100000"
                  min={1}
                  value={formData.budgetMax}
                  onChange={(e) => setFormData((prev) => ({ ...prev, budgetMax: e.target.value }))}
                  onBlur={() => handleBlur('budgetMax')}
                  className={inputErrorClasses('budgetMax')}
                />
                {hasError('budgetMax') && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {getFieldError('budgetMax')}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2" ref={(el) => (fieldRefs.current.deadline = el)}>
              <Label htmlFor="deadline">
                Deadline <span className="text-destructive">*</span>
              </Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData((prev) => ({ ...prev, deadline: e.target.value }))}
                onBlur={() => handleBlur('deadline')}
                className={inputErrorClasses('deadline')}
                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} // Tomorrow
              />
              {hasError('deadline') && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {getFieldError('deadline')}
                </p>
              )}
              <p className="text-xs text-muted-foreground">Must be a future date</p>
            </div>
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card>
          <CardHeader>
            <CardTitle>
              Requirements <span className="text-destructive">*</span>
            </CardTitle>
            <CardDescription>List specific requirements for solutions (at least 1 required, min 5 chars each)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4" ref={(el) => (fieldRefs.current.requirements = el)}>
            <div className="flex gap-2">
              <div className="flex-1 space-y-1">
                <Input
                  placeholder="Add a requirement (min 5 characters)..."
                  value={newRequirement}
                  onChange={(e) => {
                    setNewRequirement(e.target.value);
                    if (requirementError) setRequirementError('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                  className={cn(requirementError && 'border-destructive ring-1 ring-destructive/50')}
                />
                {requirementError && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {requirementError}
                  </p>
                )}
              </div>
              <Button type="button" variant="secondary" onClick={addRequirement}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {hasError('requirements') && formData.requirements.length === 0 && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {getFieldError('requirements')}
              </p>
            )}
            {formData.requirements.length > 0 && (
              <ul className="space-y-2">
                {formData.requirements.map((req, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg"
                  >
                    <span className="flex-1 text-sm">{req}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeRequirement(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.requirements.length} requirement{formData.requirements.length !== 1 ? 's' : ''} added
            </p>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>
              Tags <span className="text-destructive">*</span>
            </CardTitle>
            <CardDescription>Add tags to help innovators find your problem (1-10 tags, min 2 chars each)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4" ref={(el) => (fieldRefs.current.tags = el)}>
            <div className="flex gap-2">
              <div className="flex-1 space-y-1">
                <Input
                  placeholder="Add a tag (min 2 characters)..."
                  value={newTag}
                  onChange={(e) => {
                    setNewTag(e.target.value);
                    if (tagError) setTagError('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className={cn(tagError && 'border-destructive ring-1 ring-destructive/50')}
                  disabled={formData.tags.length >= 10}
                />
                {tagError && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {tagError}
                  </p>
                )}
              </div>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={addTag}
                disabled={formData.tags.length >= 10}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {hasError('tags') && formData.tags.length === 0 && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {getFieldError('tags')}
              </p>
            )}
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                    {tag}
                    <button
                      type="button"
                      className="ml-1 p-0.5 rounded hover:bg-destructive/20 hover:text-destructive transition-colors"
                      onClick={() => removeTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.tags.length}/10 tags
            </p>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSubmit('draft')}
            disabled={isLoading || !formData.title.trim()}
          >
            <Save className="h-4 w-4 mr-2" />
            Save as Draft
          </Button>
          <Button
            type="button"
            variant="hero"
            onClick={() => handleSubmit('open')}
            disabled={isPublishDisabled}
            title={isPublishDisabled ? 'Please fill all required fields' : 'Publish your problem'}
          >
            <Send className="h-4 w-4 mr-2" />
            Publish Problem
          </Button>
        </div>
        {Object.keys(errors).length > 0 && (
          <p className="text-sm text-destructive text-center">
            Please fix the highlighted errors above before publishing.
          </p>
        )}
      </form>
    </div>
  );
};

export default NewProblemPage;
