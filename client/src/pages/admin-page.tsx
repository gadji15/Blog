import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@/lib/i18n';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Content, User, contentSchema, genres } from '@shared/schema';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Edit, Trash2, Plus, Film, Tv, User as UserIcon, LineChart } from 'lucide-react';

// Form schema for content management
const contentFormSchema = contentSchema.omit({ id: true });

export default function AdminPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [contentToDelete, setContentToDelete] = useState<Content | null>(null);
  
  // Fetch all content
  const { data: allContent = [], isLoading: isLoadingContent } = useQuery<Content[]>({
    queryKey: ['/api/content'],
  });
  
  // Check if user is admin, if not show not authorized message
  if (!user?.isAdmin) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center">
        <UserIcon className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Not Authorized</h1>
        <p className="text-muted-foreground">You don't have permission to access this page.</p>
      </div>
    );
  }
  
  const movies = allContent.filter(content => content.type === 'movie');
  const series = allContent.filter(content => content.type === 'series');
  
  // Set up form for adding/editing content
  const contentForm = useForm<z.infer<typeof contentFormSchema>>({
    resolver: zodResolver(contentFormSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "movie",
      releaseYear: new Date().getFullYear(),
      genres: [],
      posterUrl: "",
      backdropUrl: "",
      rating: 85,
      duration: 120,
      videoUrl: "",
      trailerUrl: "",
      isExclusive: false,
      isNew: true,
      seasons: 1,
      director: "",
      studio: "",
      maturityRating: "",
      cast: [],
    },
  });
  
  // Reset form when dialog opens/closes
  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedContent(null);
      contentForm.reset();
    }
  };
  
  // Edit content
  const handleEditContent = (content: Content) => {
    setSelectedContent(content);
    contentForm.reset({
      ...content,
      genres: content.genres || [],
    });
    setIsDialogOpen(true);
  };
  
  const { toast } = useToast();
  
  // Add content mutation
  const addContentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof contentFormSchema>) => {
      if (selectedContent) {
        // Update existing content
        const res = await apiRequest(
          'PATCH', 
          `/api/admin/content/${selectedContent.id}`, 
          data
        );
        return await res.json();
      } else {
        // Create new content
        const res = await apiRequest('POST', '/api/admin/content', data);
        return await res.json();
      }
    },
    onSuccess: (content) => {
      queryClient.invalidateQueries({ queryKey: ['/api/content'] });
      setIsDialogOpen(false);
      contentForm.reset();
      toast({
        title: selectedContent ? "Content updated" : "Content added",
        description: `"${content.title}" has been ${selectedContent ? "updated" : "added"} successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Action failed",
        description: error.message || "There was an error processing your request",
        variant: "destructive",
      });
    }
  });
  
  // Delete content mutation
  const deleteContentMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/admin/content/${id}`);
      return await res.json();
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['/api/content'] });
      toast({
        title: "Content deleted",
        description: "The content has been deleted successfully."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed", 
        description: error.message || "There was an error deleting the content",
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  const onSubmitContent = (data: z.infer<typeof contentFormSchema>) => {
    if (selectedContent) {
      // Update existing content
      addContentMutation.mutate({ ...data });
    } else {
      // Add new content
      addContentMutation.mutate(data);
    }
  };
  
  // Render content table
  const renderContentTable = (contentList: Content[]) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Year</TableHead>
            <TableHead>Genres</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contentList.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                No content found
              </TableCell>
            </TableRow>
          ) : (
            contentList.map((content) => (
              <TableRow key={content.id}>
                <TableCell className="font-medium">{content.title}</TableCell>
                <TableCell>{content.releaseYear}</TableCell>
                <TableCell>{content.genres.join(', ')}</TableCell>
                <TableCell>{content.rating}%</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditContent(content)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => {
                      setContentToDelete(content);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-5rem)] container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{t('adminPanel')}</h1>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button className="flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              <span>Add Content</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedContent ? `Edit ${selectedContent.title}` : 'Add New Content'}
              </DialogTitle>
              <DialogDescription>
                Fill in the details to {selectedContent ? 'update' : 'add'} content to the platform.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...contentForm}>
              <form onSubmit={contentForm.handleSubmit(onSubmitContent)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={contentForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Content title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={contentForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="movie">Movie</SelectItem>
                            <SelectItem value="series">Series</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={contentForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Content description" 
                          className="resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={contentForm.control}
                    name="releaseYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Release Year</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="2023" 
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value))} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={contentForm.control}
                    name="rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rating (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="85" 
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value))} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {contentForm.watch('type') === 'movie' ? (
                    <FormField
                      control={contentForm.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (minutes)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="120" 
                              {...field}
                              onChange={e => field.onChange(parseInt(e.target.value))} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <FormField
                      control={contentForm.control}
                      name="seasons"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Seasons</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="1" 
                              {...field}
                              onChange={e => field.onChange(parseInt(e.target.value))} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={contentForm.control}
                    name="posterUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Poster URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/poster.jpg" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={contentForm.control}
                    name="backdropUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Backdrop URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/backdrop.jpg" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={contentForm.control}
                  name="videoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/video.mp4" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={contentForm.control}
                  name="genres"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel>Genres</FormLabel>
                        <FormDescription>
                          Select the genres that apply to this content.
                        </FormDescription>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {genres.map((genre) => (
                          <FormField
                            key={genre}
                            control={contentForm.control}
                            name="genres"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={genre}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(genre)}
                                      onCheckedChange={(checked) => {
                                        const currentGenres = field.value || [];
                                        return checked
                                          ? field.onChange([...currentGenres, genre])
                                          : field.onChange(
                                              currentGenres.filter(
                                                (value) => value !== genre
                                              )
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    {genre}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={contentForm.control}
                    name="isNew"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Mark as New
                          </FormLabel>
                          <FormDescription>
                            This will show a "NEW" badge on the content.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={contentForm.control}
                    name="isExclusive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Mark as Exclusive
                          </FormLabel>
                          <FormDescription>
                            This will show an "EXCLUSIVE" badge on the content.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={addContentMutation.isPending}
                  >
                    {addContentMutation.isPending ? (
                      <span className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      selectedContent ? 'Update Content' : 'Add Content'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Content</CardTitle>
            <LineChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allContent.length}</div>
            <p className="text-xs text-muted-foreground">
              {movies.length} movies, {series.length} series
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured Content</CardTitle>
            <Film className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allContent.filter(content => content.isExclusive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Exclusive content items
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Releases</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allContent.filter(content => content.isNew).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Recently added content
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Rated</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allContent.filter(content => (content.rating || 0) > 90).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Content with 90%+ rating
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Content Management Tabs */}
      <Tabs defaultValue="movies">
        <TabsList className="mb-6">
          <TabsTrigger value="movies" className="flex items-center">
            <Film className="mr-2 h-4 w-4" />
            Movies
          </TabsTrigger>
          <TabsTrigger value="series" className="flex items-center">
            <Tv className="mr-2 h-4 w-4" />
            Series
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center">
            <UserIcon className="mr-2 h-4 w-4" />
            Users
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="movies">
          <Card>
            <CardHeader>
              <CardTitle>Movies</CardTitle>
              <CardDescription>
                Manage movies available on the platform. Add, edit, or remove movie content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingContent ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                renderContentTable(movies)
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="series">
          <Card>
            <CardHeader>
              <CardTitle>Series</CardTitle>
              <CardDescription>
                Manage TV series available on the platform. Add, edit, or remove series content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingContent ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                renderContentTable(series)
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Manage user accounts and permissions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center py-8 text-muted-foreground">
                <p>User management functionality would be implemented here in the full application.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{' '}
              <span className="font-semibold">{contentToDelete?.title}</span> and remove it from all user favorites and watch history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (contentToDelete) {
                  deleteContentMutation.mutate(contentToDelete.id);
                  setContentToDelete(null);
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteContentMutation.isPending}
            >
              {deleteContentMutation.isPending ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </span>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
