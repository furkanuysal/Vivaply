import { ConfirmDialog } from "@/shared/ui";
import EntertainmentStatusDialog from "@/features/entertainment/components/library/EntertainmentStatusDialog";
import GameProgressDialog from "@/features/entertainment/components/library/GameProgressDialog";
import type {
  GameContentDto,
  TmdbContentDto,
  UpdateEntertainmentStatusDto,
  UpdateGameProgressDto,
} from "@/features/entertainment/types";

interface EntertainmentLibraryDialogsProps {
  isConfirmOpen: boolean;
  isEditOpen: boolean;
  isStatusDialogOpen: boolean;
  removeDialogTitle: string;
  confirmMessage: string;
  gameToEdit: GameContentDto | null;
  contentToEdit: TmdbContentDto | null;
  contentTypeToEdit: "tv" | "movie";
  onCloseConfirm: () => void;
  onConfirmRemove: () => void | Promise<void>;
  onCloseEdit: () => void;
  onCloseStatus: () => void;
  onSaveProgress: (data: UpdateGameProgressDto) => Promise<void>;
  onSaveStatus: (data: UpdateEntertainmentStatusDto) => Promise<void>;
}

export default function EntertainmentLibraryDialogs({
  isConfirmOpen,
  isEditOpen,
  isStatusDialogOpen,
  removeDialogTitle,
  confirmMessage,
  gameToEdit,
  contentToEdit,
  contentTypeToEdit,
  onCloseConfirm,
  onConfirmRemove,
  onCloseEdit,
  onCloseStatus,
  onSaveProgress,
  onSaveStatus,
}: EntertainmentLibraryDialogsProps) {
  return (
    <>
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={onCloseConfirm}
        onConfirm={onConfirmRemove}
        title={removeDialogTitle}
        message={confirmMessage}
      />
      <GameProgressDialog
        isOpen={isEditOpen}
        onClose={onCloseEdit}
        game={gameToEdit}
        onSave={onSaveProgress}
      />
      <EntertainmentStatusDialog
        isOpen={isStatusDialogOpen}
        onClose={onCloseStatus}
        content={contentToEdit}
        type={contentTypeToEdit}
        onSave={onSaveStatus}
      />
    </>
  );
}
