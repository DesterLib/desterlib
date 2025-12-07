/**
 * Metadata Job Entity
 * Shared interface for metadata processing jobs
 */

export interface MetadataJob {
  media_id: string;
  title: string;
  year?: number;
  library_id: string;
  folder_path?: string;
  filename?: string;
  media_type: string;
  rescan?: boolean;
}

