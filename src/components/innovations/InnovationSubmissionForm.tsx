import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { decodeJwt } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, X, FileText, Image as ImageIcon, Video, Save, Send, Loader2, Plus, Minus, RefreshCcw } from "lucide-react";
import { InnovationCategory } from "@/types";
import { Badge } from "@/components/ui/badge";
import aiIcon from "@/assets/ai_icon.png";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type ModerationStatus = "pending" | "approved" | "rejected" | "error";

type MediaAssetState = {
  id: string;
  assetId?: string;
  kind: "cover" | "gallery";
  previewUrl: string;
  publicUrl?: string;
  bucket?: string;
  path?: string;
  status: ModerationStatus;
  reasons?: string[];
};

const TEMP_BUCKET = "temp-uploads";
const allowedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

const buildFileKey = (userId: string | undefined, file: File, kind: "cover" | "gallery") =>
  `${userId || "anon"}:${kind}:${file.name}:${file.size}:${file.lastModified}`;



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

type RedundancyMatch = {
  id: string;
  title: string;
  tagline: string;
  category: string;
  similarity: number;
  bucket?: string | null;
  snippet?: string | null;
};

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
  { value: "healthtech", label: "Health Tech" },
  { value: "fintech", label: "Fin Tech" },
  { value: "climatetech", label: "Climate Tech" },
  { value: "edtech", label: "Ed Tech" },
  { value: "saas", label: "SaaS" },
  { value: "hardware", label: "Hardware & IoT" },
  { value: "web3", label: "Web3 & Blockchain" },
  { value: "other", label: "Other" },
];

export const InnovationSubmissionForm = ({ initialData, mode = "create" }: InnovationSubmissionFormProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverAsset, setCoverAsset] = useState<MediaAssetState | null>(
    initialData?.cover_image_url
      ? {
          id: "existing-cover",
          kind: "cover",
          previewUrl: initialData.cover_image_url,
          publicUrl: initialData.cover_image_url,
          status: "approved",
        }
      : null,
  );
  const [galleryAssets, setGalleryAssets] = useState<MediaAssetState[]>(
    (initialData?.gallery_urls || []).map((url, index) => ({
      id: `existing-${index}`,
      kind: "gallery",
      previewUrl: url,
      publicUrl: url,
      status: "approved",
    })),
  );
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [pdfNames, setPdfNames] = useState<string[]>(initialData?.pdf_urls?.map((_, i) => `Document ${i + 1}`) || []);
  const [isGeneratingTaglines, setIsGeneratingTaglines] = useState(false);
  const [taglineSuggestions, setTaglineSuggestions] = useState<string[]>([]);
  const [isRewritingDescription, setIsRewritingDescription] = useState(false);
  const [prevDescription, setPrevDescription] = useState<string | null>(null);
  const [canUndoDescription, setCanUndoDescription] = useState(false);
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [isGalleryUploading, setIsGalleryUploading] = useState(false);
  const moderationGuards = useRef<Set<string>>(new Set());
  const retryGuards = useRef<Set<string>>(new Set());
  const galleryQueue = useRef<Promise<void>>(Promise.resolve());
  const pendingPublishAction = useRef<(() => Promise<void>) | null>(null);

  const form = useForm<InnovationFormData>({
    resolver: zodResolver(innovationSchema),
    defaultValues: {
      title: initialData?.title || "",
      tagline: initialData?.tagline || "",
      category: initialData?.category || undefined, // No default category - user must select
      custom_category: initialData?.custom_category || "",
      description: initialData?.description || "",
      video_url: initialData?.video_url || "",
      without_product: initialData?.without_product || "",
      with_product: initialData?.with_product || "",
    },
  });

  const watchedCategory = form.watch("category");
  const [warningOpen, setWarningOpen] = useState(false);
  const [redundancyWarning, setRedundancyWarning] = useState<{ matches: RedundancyMatch[] }>({ matches: [] });
  const [blockData, setBlockData] = useState<{ reason: string; matches: RedundancyMatch[] } | null>(null);

  const validateImageFile = (file: File) => {
    if (!allowedImageTypes.includes(file.type)) {
      return "Only JPG, PNG, WEBP, and GIF files are allowed";
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return "Images must be under 10MB";
    }
    return null;
  };

  const formatReasons = (reasons?: string[]) =>
    reasons && reasons.length > 0 ? reasons.join(", ") : "Image rejected due to unsafe content.";

  const renderStatusBadge = (status: ModerationStatus) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Approved</Badge>;
      case "pending":
        return (
          <Badge variant="secondary" className="gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Scanning...
          </Badge>
        );
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "error":
        return <Badge variant="secondary">Scan failed</Badge>;
      default:
        return null;
    }
  };

  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${user?.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage.from("innovations").upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("innovations").getPublicUrl(filePath);

    return data.publicUrl;
  };

  const buildStoragePath = (file: File, kind: "cover" | "gallery") => {
    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    return `${user?.id}/${kind}/${fileName}`;
  };

  const moderateAsset = async (
   assetId: string,
  path: string,
  kind: "cover" | "gallery",
  bucket = TEMP_BUCKET,
) => {
  // Ensure we have a valid session token for JWT-protected functions
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  if (!accessToken) {
    console.error("No access token found", sessionError);
    toast.error("Please log in again - session token missing or expired.");
    return;
  }


  const { data, error } = await supabase.functions.invoke("moderate-image", {
      body: {
        asset_id: assetId,
        bucket,
        path,
        user_id: user?.id,
        kind,
        innovation_id: initialData?.id ?? null,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
      if (error) throw error;
  return data || {};
};

  const uploadAndModerateImage = async (
    file: File,
    kind: "cover" | "gallery",
    placeholderId?: string,
    previewOverride?: string,
  ): Promise<MediaAssetState> => {
    if (!user) {
      throw new Error("You must be logged in to upload images");
    }

    const validationError = validateImageFile(file);
    if (validationError) {
      throw new Error(validationError);
    }

    const path = buildStoragePath(file, kind);
    const previewUrl = previewOverride || URL.createObjectURL(file);

    const { error: uploadError } = await supabase.storage.from(TEMP_BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

    if (uploadError) {
      throw uploadError;
    }

    const { data: assetRecord, error: assetError } = await (supabase as any)
      .from("media_assets")
      .insert({
        user_id: user.id,
        innovation_id: initialData?.id ?? null,
        kind,
        bucket: TEMP_BUCKET,
        path,
        status: "pending",
      })
      .select()
      .single();

    if (assetError || !assetRecord) {
      throw assetError || new Error("Failed to create moderation record");
    }

    const moderationResult = await moderateAsset(assetRecord.id, path, kind, TEMP_BUCKET);
    const moderationStatus: ModerationStatus =
      moderationResult?.status && ["approved", "pending", "rejected", "error"].includes(moderationResult.status)
        ? moderationResult.status
        : "error";

    const reasons = moderationResult?.reasons as string[] | undefined;
    const publicUrl = moderationResult?.publicUrl || moderationResult?.public_url;

    return {
      id: placeholderId || assetRecord.id,
      assetId: assetRecord.id,
      kind,
      previewUrl,
      bucket: moderationStatus === "approved" ? "innovations" : TEMP_BUCKET,
      path: moderationResult?.path || path,
      publicUrl: publicUrl || undefined,
      status: moderationStatus,
      reasons,
    };
  };

  const processCoverUpload = async (file: File) => {
    const guardKey = buildFileKey(user?.id, file, "cover");
    if (moderationGuards.current.has(guardKey)) {
      toast.info("Already scanning this cover image");
      return;
    }
    moderationGuards.current.add(guardKey);
    setIsCoverUploading(true);
    const tempId = `cover-${Date.now()}`;
    const previewUrl = URL.createObjectURL(file);
    setCoverAsset({
      id: tempId,
      assetId: tempId,
      kind: "cover",
      previewUrl,
      status: "pending",
    });

    try {
      const moderatedAsset = await uploadAndModerateImage(file, "cover", tempId, previewUrl);
      setCoverAsset({ ...moderatedAsset, previewUrl });

      if (moderatedAsset.status === "rejected") {
        toast.error(formatReasons(moderatedAsset.reasons));
      } else if (moderatedAsset.status === "error") {
        toast.error("Cover image scan failed. Please retry.");
      } else {
        toast.success("Cover image approved");
      }
    } catch (error: any) {
      console.error("Error uploading cover image:", error);
      setCoverAsset(null);
      toast.error(error?.message || "Failed to upload cover image");
    } finally {
      moderationGuards.current.delete(guardKey);
      setIsCoverUploading(false);
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processCoverUpload(file);
    }
  };

  const processGalleryUpload = async (file: File) => {
    const guardKey = buildFileKey(user?.id, file, "gallery");
    if (moderationGuards.current.has(guardKey)) {
      toast.info("Already scanning this gallery image");
      return;
    }
    moderationGuards.current.add(guardKey);
    const tempId = crypto.randomUUID ? crypto.randomUUID() : `gallery-${Date.now()}`;
    const previewUrl = URL.createObjectURL(file);
    setGalleryAssets((prev) => [
      ...prev,
      {
        id: tempId,
        assetId: tempId,
        kind: "gallery",
        previewUrl,
        status: "pending",
      },
    ]);

    try {
      const moderatedAsset = await uploadAndModerateImage(file, "gallery", tempId, previewUrl);

      if (moderatedAsset.status === "rejected") {
        setGalleryAssets((prev) => prev.filter((asset) => asset.id !== tempId));
        toast.error(formatReasons(moderatedAsset.reasons));
        return;
      }

      setGalleryAssets((prev) =>
        prev.map((asset) => (asset.id === tempId ? { ...moderatedAsset, previewUrl } : asset)),
      );

      if (moderatedAsset.status === "error") {
        toast.error("Gallery image scan failed. Use Retry.");
      } else {
        toast.success("Gallery image approved");
      }
    } catch (error: any) {
      console.error("Error uploading gallery image:", error);
      setGalleryAssets((prev) => prev.filter((asset) => asset.id !== tempId));
      toast.error(error?.message || "Failed to upload gallery image");
    } finally {
      moderationGuards.current.delete(guardKey);
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsGalleryUploading(true);

    let chain = galleryQueue.current;
    files.forEach((file) => {
      chain = chain.then(async () => {
        const validationError = validateImageFile(file);
        if (validationError) {
          toast.error(validationError);
          return;
        }
        await processGalleryUpload(file);
      });
    });

    galleryQueue.current = chain.finally(() => {
      setIsGalleryUploading(false);
    });
  };

  const removeGalleryImage = (id: string) => {
    setGalleryAssets((prev) => prev.filter((asset) => asset.id !== id));
  };

  const retryModeration = async (asset: MediaAssetState) => {
    if (!user) {
      toast.error("You must be logged in to retry moderation");
      return;
    }

    if (!asset.assetId || !asset.path || !asset.bucket) {
      toast.error("Unable to retry scan. Please re-upload the image.");
      return;
    }

    if (retryGuards.current.has(asset.assetId)) {
      toast.info("Scan already in progress for this image");
      return;
    }
    retryGuards.current.add(asset.assetId);

    const pendingState: MediaAssetState = { ...asset, status: "pending" };
    if (asset.kind === "cover") {
      setCoverAsset(pendingState);
      setIsCoverUploading(true);
    } else {
      setGalleryAssets((prev) => prev.map((item) => (item.id === asset.id ? pendingState : item)));
      setIsGalleryUploading(true);
    }

    const runRetry = async () => {
      const moderationResult = await moderateAsset(asset.assetId, asset.path, asset.kind, asset.bucket);
      const moderationStatus: ModerationStatus =
        moderationResult?.status && ["approved", "pending", "rejected", "error"].includes(moderationResult.status)
          ? moderationResult.status
          : "error";
      const publicUrl = moderationResult?.publicUrl || moderationResult?.public_url;
      const reasons = moderationResult?.reasons as string[] | undefined;

      const updatedAsset: MediaAssetState = {
        ...asset,
        status: moderationStatus,
        publicUrl: publicUrl || asset.publicUrl,
        bucket: moderationStatus === "approved" ? "innovations" : asset.bucket,
        path: moderationResult?.path || asset.path,
        reasons,
      };

      if (moderationStatus === "rejected") {
        if (asset.kind === "cover") {
          setCoverAsset(updatedAsset);
        } else {
          setGalleryAssets((prev) => prev.filter((item) => item.id !== asset.id));
        }
        toast.error(formatReasons(reasons));
        return;
      }

      if (asset.kind === "cover") {
        setCoverAsset(updatedAsset);
      } else {
        setGalleryAssets((prev) => prev.map((item) => (item.id === asset.id ? updatedAsset : item)));
      }

      if (moderationStatus === "error") {
        toast.error("Scan failed again. Please re-upload the image.");
      } else {
        toast.success("Image approved after retry");
      }
    };

    const handleRetryError = (error: any) => {
      console.error("Error retrying moderation:", error);
      const failedState: MediaAssetState = { ...asset, status: "error" };
      if (asset.kind === "cover") {
        setCoverAsset(failedState);
      } else {
        setGalleryAssets((prev) => prev.map((item) => (item.id === asset.id ? failedState : item)));
      }
      toast.error(error?.message || "Failed to retry moderation");
    };

    if (asset.kind === "gallery") {
      galleryQueue.current = galleryQueue.current
        .then(() => runRetry())
        .catch(handleRetryError)
        .finally(() => {
          setIsGalleryUploading(false);
          retryGuards.current.delete(asset.assetId!);
        });
    } else {
      runRetry()
        .catch(handleRetryError)
        .finally(() => {
          setIsCoverUploading(false);
          retryGuards.current.delete(asset.assetId!);
        });
    }
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

    if (!coverAsset || coverAsset.status !== "approved" || !coverAsset.publicUrl) {
      toast.error("Cover image must be uploaded and approved before submitting");
      return;
    }

    // Pending check handled by the !== "approved" check above

    const pendingGallery = galleryAssets.some((asset) => asset.status === "pending");
    if (pendingGallery) {
      toast.error("Gallery moderation is still running. Please wait.");
      return;
    }

    const approvedGalleryAssets = galleryAssets.filter(
      (asset) => asset.status === "approved" && asset.publicUrl,
    );

    if (approvedGalleryAssets.length === 0) {
      toast.error("At least one approved gallery image is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const decoded = decodeJwt(accessToken);
      console.log("token iss", decoded?.iss, "accessToken present", !!accessToken, "anonKey present", !!anonKey);
      if (!accessToken) {
        toast.error("Please login again");
        setIsSubmitting(false);
        return;
      }

      setBlockData(null);
      setWarningOpen(false);

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
        cover_image_url: coverAsset.publicUrl,
        video_url: data.video_url || null,
        gallery_urls: approvedGalleryAssets.map((asset) => asset.publicUrl!) || [],
        pdf_urls: allPdfUrls,
        without_product: data.without_product,
        with_product: data.with_product,
        status,
        innovator_id: user.id,
      };

      const assetIdsToLink = [
        ...(coverAsset.assetId ? [coverAsset.assetId] : []),
        ...approvedGalleryAssets.map((asset) => asset.assetId).filter(Boolean),
      ] as string[];

      const performSave = async () => {
        let innovationId = initialData?.id;

        if (mode === "edit" && initialData?.id) {
          const { error } = await supabase.from("innovations").update(innovationData).eq("id", initialData.id);
          console.log("update innovation response", { error });

          if (error) throw error;
          toast.success(asDraft ? "Innovation saved as draft" : "Innovation updated successfully");
        } else {
          const { data: inserted, error } = await supabase
            .from("innovations")
            .insert(innovationData)
            .select()
            .single();
          console.log("insert innovation response", { inserted, error });

          if (error) throw error;
          innovationId = inserted?.id || innovationId;
          toast.success(asDraft ? "Innovation saved as draft" : "Innovation published successfully");
        }

        // TODO: Link media assets when media_assets table is implemented
        // if (innovationId && assetIdsToLink.length > 0) {
        //   await supabase.from("media_assets").update({ innovation_id: innovationId }).in("id", assetIdsToLink);
        // }

        if (innovationId && status !== "draft") {
          console.log("invoking upsert-innovation-embedding", { innovationId });
          const { data: embedData, error: embedError } = await supabase.functions.invoke("upsert-innovation-embedding", {
            body: { innovation_id: innovationId },
            headers: { Authorization: `Bearer ${accessToken}`, apikey: anonKey },
          });
          console.log("upsert-innovation-embedding result", { embedData, embedError });

          if (embedError) {
            toast.error("Published but embedding update failed");
          }
        }

        navigate("/innovations");
      };

      if (!asDraft) {
        try {
          console.log("invoking check-innovation-redundancy", {
            payload: {
              innovator_id: user.id,
              title: innovationData.title,
              tagline: innovationData.tagline,
              category: innovationData.category,
              custom_category: innovationData.custom_category,
              description: innovationData.description,
              without_product: innovationData.without_product,
              with_product: innovationData.with_product,
            },
          });

          const { data: redundancyData, error: redundancyError } = await supabase.functions.invoke(
            "check-innovation-redundancy",
            {
              body: {
                innovator_id: user.id,
                title: innovationData.title,
                tagline: innovationData.tagline,
                category: innovationData.category,
                custom_category: innovationData.custom_category,
                description: innovationData.description,
                without_product: innovationData.without_product,
                with_product: innovationData.with_product,
              },
              headers: { Authorization: `Bearer ${accessToken}`, apikey: anonKey },
            },
          );
          let parsedErrorBody: any = null;
          let redundancyStatus: number | undefined = (redundancyError as any)?.status;
          if (redundancyError && (redundancyError as any)?.context?.response) {
            const resp = (redundancyError as any).context.response as Response;
            redundancyStatus = resp.status ?? redundancyStatus;
            try {
              parsedErrorBody = await resp.clone().json();
            } catch {
              parsedErrorBody = null;
            }
          }

          const redundancyResult = (redundancyData as any) ?? parsedErrorBody;
          console.log("check-innovation-redundancy result", {
            redundancyData,
            redundancyError,
            redundancyStatus,
            parsedErrorBody,
          });

          const blockResponse = redundancyResult?.block === true || redundancyStatus === 409;

          if (blockResponse) {
            const matches = (redundancyResult?.matches || []) as RedundancyMatch[];
            setBlockData({
              reason: redundancyResult?.reason || "This submission appears to be a duplicate",
              matches,
            });
            setIsSubmitting(false);
            return;
          }

          if (redundancyError && !redundancyResult) {
            toast.warning("Could not check similarity. Continuing to publish.");
            await performSave();
            return;
          }

          if (redundancyResult?.warning) {
            pendingPublishAction.current = performSave;
            setRedundancyWarning({ matches: (redundancyResult?.matches || []) as RedundancyMatch[] });
            setWarningOpen(true);
            setIsSubmitting(false);
            return;
          }
        } catch (error) {
          console.error("redundancy check failed:", error);
          toast.warning("Could not check similarity. Continuing to publish.");
        }
      }

      await performSave();
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
                {coverAsset ? (
                  <div className="relative w-40 h-24 rounded-lg overflow-hidden border border-border">
                    <img
                      src={coverAsset.previewUrl || coverAsset.publicUrl}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1 left-1">{renderStatusBadge(coverAsset.status)}</div>
                    {coverAsset.status === "error" && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="absolute bottom-1 right-8 h-6 w-6"
                        onClick={() => retryModeration(coverAsset)}
                        title="Retry scan"
                      >
                        <RefreshCcw className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => {
                        setCoverAsset(null);
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
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCoverImageChange}
                      disabled={isCoverUploading}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Gallery */}
            <div className="space-y-2">
              <Label>Image Gallery * (at least 1 required)</Label>
              <div className="flex flex-wrap gap-3">
                {galleryAssets.map((asset) => (
                  <div key={asset.id} className="relative w-24 h-24 rounded-lg overflow-hidden border border-border">
                    <img
                      src={asset.previewUrl || asset.publicUrl}
                      alt={`Gallery ${asset.id}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1 left-1">{renderStatusBadge(asset.status)}</div>
                    {asset.status === "error" && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="absolute bottom-1 right-8 h-5 w-5"
                        onClick={() => retryModeration(asset)}
                        title="Retry scan"
                      >
                        <RefreshCcw className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-5 w-5"
                      onClick={() => removeGalleryImage(asset.id)}
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
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleGalleryChange}
                    disabled={isGalleryUploading}
                  />
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
          {/* Only show Save as Draft for create mode, not edit mode */}
          {mode === "create" && (
            <Button
              type="button"
              variant="secondary"
              onClick={form.handleSubmit((data) => onSubmit(data, true))}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save as Draft
            </Button>
          )}
          <Button type="button" onClick={form.handleSubmit((data) => onSubmit(data, false))} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            {mode === "edit" ? "Update Innovation" : "Publish Innovation"}
          </Button>
        </div>
      </form>

      {/* Redundancy warning dialog */}
      <Dialog
        open={warningOpen}
        onOpenChange={(open) => {
          setWarningOpen(open);
          if (!open) {
            setRedundancyWarning({ matches: [] });
            pendingPublishAction.current = null;
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Similar innovations found</DialogTitle>
            <DialogDescription>
              We found similar published innovations. Review them before publishing or continue anyway.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {redundancyWarning.matches?.length === 0 && (
              <p className="text-sm text-muted-foreground">No matches to display.</p>
            )}
            {redundancyWarning.matches?.map((match) => (
              <div key={match.id} className="p-3 rounded-md border border-border">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{match.title}</p>
                  <span className="text-xs text-muted-foreground">{match.bucket || "Related"}</span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{match.tagline || match.snippet}</p>
                <p className="text-xs text-muted-foreground mt-1">Similarity: {(match.similarity * 100).toFixed(0)}%</p>
              </div>
            ))}
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setWarningOpen(false);
              }}
            >
              Edit submission
            </Button>
            <Button
              onClick={async () => {
                setWarningOpen(false);
                setIsSubmitting(true);
                try {
                  await pendingPublishAction.current?.();
                } finally {
                  setIsSubmitting(false);
                  pendingPublishAction.current = null;
                }
              }}
            >
              Publish anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Blocking dialog */}
      <Dialog open={!!blockData} onOpenChange={(open) => !open && setBlockData(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Potential duplicate</DialogTitle>
            <DialogDescription>{blockData?.reason}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {blockData?.matches?.map((match) => (
              <div key={match.id} className="p-3 rounded-md border border-border">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{match.title}</p>
                  <span className="text-xs text-muted-foreground">{match.bucket || "Likely duplicate"}</span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{match.tagline || match.snippet}</p>
                <p className="text-xs text-muted-foreground mt-1">Similarity: {(match.similarity * 100).toFixed(0)}%</p>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setBlockData(null);
              }}
            >
              Edit submission
            </Button>
            <Button
              disabled={!blockData?.matches?.[0]?.id}
              onClick={() => {
                const targetId = blockData?.matches?.[0]?.id;
                if (targetId) {
                  navigate(`/innovations/${targetId}`);
                  setBlockData(null);
                }
              }}
            >
              View existing
            </Button>
            <Button variant="ghost" onClick={() => setBlockData(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Form>
  );
};
