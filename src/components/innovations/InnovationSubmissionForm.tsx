import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, X, FileText, Image as ImageIcon, Video, Save, Send, Loader2, Plus, Minus } from "lucide-react";
import { InnovationCategory } from "@/types";
import aiIcon from "@/assets/ai_icon.png";



const innovationSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
  tagline: z
    .string()
    .min(10, "Tagline must be at least 10 characters")
    .max(200, "Tagline must be less than 200 characters"),
  category: z.enum(["ai", "healthtech", "fintech", "climatetech", "edtech", "saas", "hardware", "web3", "other"]),
  custom_category: z.string().optional(),
  description: z.string().min(50, "Description must be at least 50 characters"),
  video_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  without_product: z.string().min(30, "Please describe the problem scenario (min 30 characters)"),
  with_product: z.string().min(30, "Please describe the solution scenario (min 30 characters)"),
}).refine(
  (data) => data.category !== "other" || (data.custom_category && data.custom_category.trim().length >= 2),
  {
    message: "Please specify a category (min 2 characters)",
    path: ["custom_category"],
  }
);

type InnovationFormData = z.infer<typeof innovationSchema>;

interface InnovationSubmissionFormProps {
  initialData?: Partial<
    InnovationFormData & {
      id?: string;
      cover_image_url?: string;
      gallery_urls?: string[];
      pdf_urls?: string[];
      custom_category?: string;
    }
  >;
  mode?: "create" | "edit";
}

const categoryOptions: { value: InnovationCategory; label: string }[] = [
  { value: "ai", label: "Artificial Intelligence" },
  { value: "healthtech", label: "HealthTech" },
  { value: "fintech", label: "FinTech" },
  { value: "climatetech", label: "ClimateTech" },
  { value: "edtech", label: "EdTech" },
  { value: "saas", label: "SaaS" },
  { value: "hardware", label: "Hardware & IoT" },
  { value: "web3", label: "Web3 & Blockchain" },
  { value: "other", label: "Other" },
];

export const InnovationSubmissionForm = ({ initialData, mode = "create" }: InnovationSubmissionFormProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string>(initialData?.cover_image_url || "");
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>(initialData?.gallery_urls || []);
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [pdfNames, setPdfNames] = useState<string[]>(initialData?.pdf_urls?.map((_, i) => `Document ${i + 1}`) || []);
  const [isGeneratingTaglines, setIsGeneratingTaglines] = useState(false);
  const [taglineSuggestions, setTaglineSuggestions] = useState<string[]>([]);
  const [isRewritingDescription, setIsRewritingDescription] = useState(false);
  const [prevDescription, setPrevDescription] = useState<string | null>(null);
  const [canUndoDescription, setCanUndoDescription] = useState(false);

  const form = useForm<InnovationFormData>({
    resolver: zodResolver(innovationSchema),
    defaultValues: {
      title: initialData?.title || "",
      tagline: initialData?.tagline || "",
      category: initialData?.category || "other",
      custom_category: initialData?.custom_category || "",
      description: initialData?.description || "",
      video_url: initialData?.video_url || "",
      without_product: initialData?.without_product || "",
      with_product: initialData?.with_product || "",
    },
  });

  const watchedCategory = form.watch("category");

  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${user?.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage.from("innovations").upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("innovations").getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      setCoverImagePreview(URL.createObjectURL(file));
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setGalleryFiles((prev) => [...prev, ...files]);
    const previews = files.map((file) => URL.createObjectURL(file));
    setGalleryPreviews((prev) => [...prev, ...previews]);
  };

  const removeGalleryImage = (index: number) => {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPdfFiles((prev) => [...prev, ...files]);
    setPdfNames((prev) => [...prev, ...files.map((f) => f.name)]);
  };

  const removePdf = (index: number) => {
    setPdfFiles((prev) => prev.filter((_, i) => i !== index));
    setPdfNames((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerateTaglines = async () => {
    const title = (form.getValues("title") ?? "").trim();
    if (!title || title.length < 3) {
      toast.error("Please enter an innovation title first");
      return;
    }

    setIsGeneratingTaglines(true);
    setTaglineSuggestions([]);

    try {
      const { data, error } = await supabase.functions.invoke("generate-taglines", {
        body: { title, count: 5 },
      });

      if (error) throw error;

      const taglines = data?.taglines ?? data;
      if (!Array.isArray(taglines)) throw new Error("Invalid tagline response");

      setTaglineSuggestions(taglines.slice(0, 5));
    } catch (error: any) {
      console.error("Error generating taglines:", error);
      toast.error(error?.message || "Failed to generate taglines");
    } finally {
      setIsGeneratingTaglines(false);
    }
  };

  const handleRewriteDescription = async () => {
    const currentDescription = form.getValues("description") ?? "";
    const description = currentDescription.trim();
    if (!description) {
      toast.error("Please enter a description first");
      return;
    }

    setPrevDescription(currentDescription);
    setIsRewritingDescription(true);

    try {
      const { data, error } = await supabase.functions.invoke("rewrite-description", {
        body: { text: description, tone: "professional", maxWords: 150 },
      });

      if (error) throw error;

      const rewritten = data?.rewritten ?? data;
      if (!rewritten || typeof rewritten !== "string") {
        throw new Error("Invalid rewrite response");
      }

      form.setValue("description", rewritten, { shouldValidate: true });
      setCanUndoDescription(true);
      toast.success("Description improved");
    } catch (error: any) {
      console.error("Error rewriting description:", error);
      toast.error(error?.message || "Failed to improve description");
    } finally {
      setIsRewritingDescription(false);
    }
  };

  const handleUndoDescription = () => {
    if (!prevDescription) return;
    form.setValue("description", prevDescription, { shouldValidate: true });
    setCanUndoDescription(false);
    toast.success("Restored original description");
  };


  const onSubmit = async (data: InnovationFormData, asDraft: boolean) => {
    if (!user) {
      toast.error("You must be logged in to submit an innovation");
      return;
    }

    if (!coverImage && !coverImagePreview) {
      toast.error("Cover image is required");
      return;
    }

    if (galleryPreviews.length === 0) {
      toast.error("At least one gallery image is required");
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload cover image if new
      let coverImageUrl = coverImagePreview;
      if (coverImage) {
        coverImageUrl = await uploadFile(coverImage, "covers");
      }

      // Upload gallery images if new
      const newGalleryUrls = await Promise.all(galleryFiles.map((file) => uploadFile(file, "gallery")));
      const allGalleryUrls = [
        ...(initialData?.gallery_urls?.filter((_, i) => i < galleryPreviews.length - galleryFiles.length) || []),
        ...newGalleryUrls,
      ];

      // Upload PDFs if new
      const newPdfUrls = await Promise.all(pdfFiles.map((file) => uploadFile(file, "pdfs")));
      const allPdfUrls = [
        ...(initialData?.pdf_urls?.filter((_, i) => i < pdfNames.length - pdfFiles.length) || []),
        ...newPdfUrls,
      ];

      const status: "draft" | "published" = asDraft ? "draft" : "published";

      const innovationData = {
        title: data.title,
        tagline: data.tagline,
        category: data.category as
          | "ai"
          | "healthtech"
          | "fintech"
          | "climatetech"
          | "edtech"
          | "saas"
          | "hardware"
          | "web3"
          | "other",
        custom_category: data.category === "other" ? data.custom_category : null,
        description: data.description,
        cover_image_url: coverImageUrl,
        video_url: data.video_url || null,
        gallery_urls: allGalleryUrls,
        pdf_urls: allPdfUrls,
        without_product: data.without_product,
        with_product: data.with_product,
        status,
        innovator_id: user.id,
      };

      if (mode === "edit" && initialData?.id) {
        const { error } = await supabase.from("innovations").update(innovationData).eq("id", initialData.id);

        if (error) throw error;
        toast.success(asDraft ? "Innovation saved as draft" : "Innovation updated successfully");
      } else {
        const { error } = await supabase.from("innovations").insert(innovationData);

        if (error) throw error;
        toast.success(asDraft ? "Innovation saved as draft" : "Innovation published successfully");
      }

      navigate("/innovations");
    } catch (error: any) {
      console.error("Error submitting innovation:", error);
      toast.error(error.message || "Failed to submit innovation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-8">
        {/* Basic Details */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm">
                1
              </span>
              Basic Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Innovation Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your innovation title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tagline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center justify-between gap-3">
                    <span>Short Tagline *</span>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateTaglines}
                      disabled={isGeneratingTaglines}
                      className="gap-2"
                    >
                      {isGeneratingTaglines ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <img src={aiIcon} alt="AI" className="h-4 w-4" />
                      )}
                      AI Suggest
                    </Button>
                  </FormLabel>

                  <FormControl>
                    <Input
                      placeholder="A compelling one-liner about your innovation"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        // if user starts typing manually, hide old suggestions
                        if (taglineSuggestions.length) setTaglineSuggestions([]);
                      }}
                    />
                  </FormControl>

                  <FormDescription>Max 200 characters</FormDescription>
                  <FormMessage />

                  {/* Suggestions as pill buttons */}
                  {taglineSuggestions.length > 0 && (
                    <div className="pt-2 space-y-2">
                      <div className="text-xs text-muted-foreground">
                        Suggestions (click to use):
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {taglineSuggestions.map((t, idx) => (
                          <button
                            key={`${t}-${idx}`}
                            type="button"
                            onClick={() => {
                              const clean = (t ?? "").trim();
                              if (!clean) return;

                              form.setValue("tagline", clean, {
                                shouldValidate: true,
                                shouldDirty: true,
                              });

                              toast.success("Tagline applied");
                            }}
                            className="px-3 py-1.5 rounded-full border border-border bg-secondary/30 hover:bg-secondary/50 text-sm transition-colors"
                            title="Click to use this tagline"
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </FormItem>
              )}
            />


            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchedCategory === "other" && (
              <FormField
                control={form.control}
                name="custom_category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specify Category *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your category (e.g., Healthcare, FinTech)" {...field} />
                    </FormControl>
                    <FormDescription>This will be displayed alongside your innovation</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center justify-between gap-3">
                    <span>Detailed Description *</span>
                    <div className="flex items-center gap-2">
                      {canUndoDescription && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleUndoDescription}
                          disabled={isRewritingDescription}
                          className="gap-2"
                        >
                          Undo
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRewriteDescription}
                        disabled={isRewritingDescription}
                        className="gap-2"
                      >
                        {isRewritingDescription ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <img src={aiIcon} alt="AI" className="h-4 w-4" />
                        )}
                        AI Improve
                      </Button>
                    </div>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your innovation in detail..."
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Media */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm">
                2
              </span>
              Media
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Cover Image */}
            <div className="space-y-2">
              <Label>Cover Image *</Label>
              <div className="flex items-center gap-4">
                {coverImagePreview ? (
                  <div className="relative w-40 h-24 rounded-lg overflow-hidden border border-border">
                    <img src={coverImagePreview} alt="Cover preview" className="w-full h-full object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => {
                        setCoverImage(null);
                        setCoverImagePreview("");
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center w-40 h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                    <div className="text-center">
                      <ImageIcon className="h-6 w-6 mx-auto text-muted-foreground" />
                      <span className="text-xs text-muted-foreground mt-1">Upload</span>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleCoverImageChange} />
                  </label>
                )}
              </div>
            </div>

            {/* Gallery */}
            <div className="space-y-2">
              <Label>Image Gallery * (at least 1 required)</Label>
              <div className="flex flex-wrap gap-3">
                {galleryPreviews.map((preview, index) => (
                  <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden border border-border">
                    <img src={preview} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-5 w-5"
                      onClick={() => removeGalleryImage(index)}
                    >
                      <X className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                ))}
                <label className="flex items-center justify-center w-24 h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                  <div className="text-center">
                    <Upload className="h-5 w-5 mx-auto text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Add</span>
                  </div>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryChange} />
                </label>
              </div>
            </div>

            {/* Video URL */}
            <FormField
              control={form.control}
              name="video_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Video URL (YouTube/Vimeo)
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="https://youtube.com/watch?v=..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* PDFs */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documents (Pitch deck, whitepaper, etc.)
              </Label>
              <div className="space-y-2">
                {pdfNames.map((name, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-secondary/50"
                  >
                    <span className="text-sm truncate">{name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removePdf(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <label className="flex items-center justify-center w-full py-3 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Upload className="h-4 w-4" />
                    <span className="text-sm">Upload PDF files</span>
                  </div>
                  <input type="file" accept=".pdf" multiple className="hidden" onChange={handlePdfChange} />
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Use Case Story */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm">
                3
              </span>
              Use Case Story
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="without_product"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-destructive">
                      <Minus className="h-4 w-4" />
                      WITHOUT the Product *
                    </FormLabel>
                    <FormDescription>Describe the problem scenario, pain points, costs, inefficiencies</FormDescription>
                    <FormControl>
                      <Textarea
                        placeholder="Before our solution, users faced..."
                        className="min-h-[150px] border-destructive/30 focus:border-destructive"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="with_product"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-primary">
                      <Plus className="h-4 w-4" />
                      WITH the Product *
                    </FormLabel>
                    <FormDescription>Describe the improved scenario, benefits, measurable outcomes</FormDescription>
                    <FormControl>
                      <Textarea
                        placeholder="With our solution, users can now..."
                        className="min-h-[150px] border-primary/30 focus:border-primary"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate("/innovations")} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={form.handleSubmit((data) => onSubmit(data, true))}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save as Draft
          </Button>
          <Button type="button" onClick={form.handleSubmit((data) => onSubmit(data, false))} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Publish Innovation
          </Button>
        </div>
      </form>
    </Form>
  );
};
