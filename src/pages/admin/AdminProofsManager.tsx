import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { UploadCloud, Trash2, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore'; // Import useStore if needed for global refresh

interface Proof {
  id: number;
  created_at: string;
  image_url: string;
  proof_date: string | null;
}

const PROOF_IMAGE_BUCKET = 'proof-images'; // Use the new bucket name

export const AdminProofsManager: React.FC = () => {
  const { fetchProofs } = useStore(); // Assuming you add fetchProofs to store
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [proofDate, setProofDate] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadProofs();
  }, []);

  const loadProofs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('proofs')
        .select('*')
        .order('created_at', { ascending: false }); // Show newest first

      if (fetchError) throw fetchError;
      setProofs(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error("Error loading proofs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUploadProof = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile) {
      setError('Please select an image file to upload.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Create unique file path
      const fileExt = selectedFile.name.split('.').pop();
      const filePath = `proof-${Date.now()}.${fileExt}`;

      // Upload image to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(PROOF_IMAGE_BUCKET)
        .upload(filePath, selectedFile);

      if (uploadError) {
        throw new Error(`Image Upload Error: ${uploadError.message}`);
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from(PROOF_IMAGE_BUCKET)
        .getPublicUrl(filePath);

      if (!urlData || !urlData.publicUrl) {
        throw new Error('Could not get public URL for uploaded image.');
      }
      const publicUrl = urlData.publicUrl;

      // Insert proof record into the database
      const { error: insertError } = await supabase
        .from('proofs')
        .insert({
          image_url: publicUrl,
          proof_date: proofDate || null // Insert null if date is empty
        });

      if (insertError) {
        // Attempt to delete uploaded file if DB insert fails
        await supabase.storage.from(PROOF_IMAGE_BUCKET).remove([filePath]);
        throw new Error(`DB Insert Error: ${insertError.message}`);
      }

      console.log('Proof uploaded and linked successfully:', publicUrl);
      setSelectedFile(null);
      setProofDate('');
      // Clear file input visually (requires ref or key change, simple reset for now)
      const fileInput = document.getElementById('proofImageUpload') as HTMLInputElement;
      if (fileInput) fileInput.value = ''; 
      
      loadProofs(); // Refresh the list
      // Optionally call global fetchProofs if Home page needs it immediately
      // fetchProofs(); 

    } catch (err: any) {
      console.error("Error during proof upload:", err);
      setError(`Failed to upload proof: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteProof = async (proof: Proof) => {
    if (!window.confirm('Are you sure you want to delete this proof? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true); // Use main loading state or a specific deleting state
    setError(null);

    try {
      // Extract file path from URL (basic example, might need refinement based on URL structure)
      const urlParts = proof.image_url.split('/');
      const filePath = urlParts.slice(urlParts.indexOf(PROOF_IMAGE_BUCKET) + 1).join('/');
      
      if (!filePath) {
          console.warn("Could not determine file path from URL for deletion:", proof.image_url);
          // Proceed to delete DB record anyway? Or throw error?
          // For now, let's proceed but log it.
      } else {
           // Delete from storage
          console.log("Attempting to delete from storage:", filePath);
          const { error: storageError } = await supabase.storage
              .from(PROOF_IMAGE_BUCKET)
              .remove([filePath]);

          if (storageError) {
              // Log error but still attempt to delete DB record
              console.error("Error deleting proof from storage (will still attempt DB deletion):", storageError.message);
              setError(`Warning: Failed to delete image file from storage: ${storageError.message}`);
          } else {
              console.log("Successfully deleted from storage:", filePath);
          }
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('proofs')
        .delete()
        .eq('id', proof.id);

      if (dbError) throw dbError;

      console.log('Proof deleted successfully from DB:', proof.id);
      setProofs(prev => prev.filter(p => p.id !== proof.id)); // Update state optimistically

    } catch (err: any) {
      console.error("Error deleting proof:", err);
      setError(`Failed to delete proof: ${err.message}`);
      // Optionally reload proofs on error to ensure consistency
      // loadProofs();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Manage Proofs</h2>

      {/* Upload Form */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-lg shadow mb-8 border border-pink-200"
      >
        <h3 className="text-xl font-semibold mb-4 text-pink-700">Upload New Proof</h3>
        <form onSubmit={handleUploadProof} className="space-y-4">
          <div>
            <label htmlFor="proofImageUpload" className="block text-sm font-medium text-gray-700 mb-1">
              Image File *
            </label>
            <Input
              id="proofImageUpload"
              type="file"
              accept="image/png, image/jpeg, image/gif"
              onChange={handleFileChange}
              required
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
            />
             {selectedFile && (
                <p className="text-xs text-gray-500 mt-1">Selected: {selectedFile.name}</p>
            )}
          </div>
          <div>
            <label htmlFor="proofDate" className="block text-sm font-medium text-gray-700 mb-1">
              Date (Optional)
            </label>
            <Input
              id="proofDate"
              type="date"
              value={proofDate}
              onChange={(e) => setProofDate(e.target.value)}
            />
          </div>
          {error && ( // Display upload-specific errors here
            <p className="text-sm text-red-600">Error: {error}</p>
          )}
          <div className="flex justify-end">
            <Button type="submit" disabled={isUploading || !selectedFile} isLoading={isUploading}>
              <UploadCloud className="w-4 h-4 mr-2" /> Upload Proof
            </Button>
          </div>
        </form>
      </motion.div>

      {/* Proofs List */}
      <div>
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Uploaded Proofs</h3>
        {isLoading ? (
           <div className="flex justify-center py-12">
             <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-pink-500"></div>
           </div>
        ) : proofs.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No proofs uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <AnimatePresence>
              {proofs.map((proof) => (
                <motion.div
                  key={proof.id}
                  layout // Animate layout changes (e.g., when deleting)
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="relative group"
                >
                  <img
                    src={proof.image_url}
                    alt={`Proof uploaded on ${proof.created_at}`}
                    className="w-full h-40 object-cover rounded-lg shadow-md"
                  />
                  {proof.proof_date && (
                      <span className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                          <Calendar className="inline w-3 h-3 mr-1"/> {proof.proof_date}
                      </span>
                  )}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-7 w-7"
                    onClick={() => handleDeleteProof(proof)}
                    title="Delete Proof"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}; 