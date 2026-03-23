import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Input, Select, SelectItem, Switch, Button, Popover, PopoverTrigger, PopoverContent, Tabs, Tab } from "@heroui/react";
import { Plus, Trash2, Pencil, Check, X, Tag, Settings, Bell, Plug, Info } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { useDataStore } from "@/stores/dataStore";
import { useSidebarTheme } from "@/hooks/useSidebarTheme";
import { hexToHSL } from "@/lib/colorUtils";
import PageHeader from "@/components/layout/PageHeader";
import ColorPicker from "@/components/ui/ColorPicker";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { toast } from "@/stores/toastStore";
import { DEFAULT_TAG_COLOR } from "@/config/tagColors";

export default function AyarlarPage() {
  const { t } = useTranslation();
  const { locale, setLocale } = useUIStore();
  const sidebarTheme = useSidebarTheme();
  const [emailNotif, setEmailNotif] = useState(true);
  const [browserNotif, setBrowserNotif] = useState(false);

  // Tag management state
  const tagDefinitions = useDataStore((s) => s.tagDefinitions);
  const hedefler = useDataStore((s) => s.hedefler);
  const addTagDefinition = useDataStore((s) => s.addTagDefinition);
  const updateTagDefinition = useDataStore((s) => s.updateTagDefinition);
  const deleteTagDefinition = useDataStore((s) => s.deleteTagDefinition);
  const renameTag = useDataStore((s) => s.renameTag);

  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(DEFAULT_TAG_COLOR);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  const getUsageCount = (tagName: string) =>
    hedefler.filter((h) => h.tags?.includes(tagName)).length;

  const handleAddTag = () => {
    const trimmed = newTagName.trim();
    if (!trimmed) return;
    const exists = tagDefinitions.some(
      (td) => td.name.toLocaleLowerCase("tr") === trimmed.toLocaleLowerCase("tr")
    );
    if (exists) {
      toast.error(t("settings.tagNameDuplicate"));
      return;
    }
    addTagDefinition({ name: trimmed, color: newTagColor });
    toast.success(t("settings.tagCreated"), `"${trimmed}" etiketi oluşturuldu.`);
    setNewTagName("");
    setNewTagColor(DEFAULT_TAG_COLOR);
  };

  const handleDeleteTag = (id: string, name: string) => {
    const count = getUsageCount(name);
    const msg = count > 0
      ? `${t("settings.tagDeleteConfirm")} ${t("settings.tagInUseWarning", { count })}`
      : t("settings.tagDeleteConfirm");
    setConfirmMessage(msg);
    setConfirmAction(() => () => {
      deleteTagDefinition(id);
      toast.success(t("settings.tagDeleted"), `"${name}" etiketi silindi.`);
    });
    setConfirmOpen(true);
  };

  const startEditing = (tag: { id: string; name: string }) => {
    setEditingId(tag.id);
    setEditName(tag.name);
  };

  const saveEditing = (id: string, oldName: string) => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    if (trimmed !== oldName) {
      const exists = tagDefinitions.some(
        (td) => td.id !== id && td.name.toLocaleLowerCase("tr") === trimmed.toLocaleLowerCase("tr")
      );
      if (exists) {
        toast.error(t("settings.tagNameDuplicate"));
        return;
      }
      renameTag(oldName, trimmed);
    }
    const detail = trimmed !== oldName ? `"${oldName}" → "${trimmed}"` : `"${trimmed}" rengi güncellendi.`;
    toast.success(t("settings.tagUpdated"), detail);
    setEditingId(null);
  };

  // ===== TAB CONTENTS =====

  const generalTab = (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Genel */}
      <div className="glass-card rounded-card p-6">
        <h2 className="text-base font-bold text-tyro-text-primary mb-4">{t("settings.general")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">{t("settings.appName")}</label>
            <Input value="TYRO Strategy" isReadOnly variant="bordered" />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-tyro-text-secondary mb-1.5">{t("profile.language")}</label>
            <Select
              selectedKeys={[locale]}
              onSelectionChange={(keys) => {
                const val = Array.from(keys)[0] as "tr" | "en";
                if (val) setLocale(val);
              }}
              variant="bordered"
            >
              <SelectItem key="tr">{t("profile.turkish")}</SelectItem>
              <SelectItem key="en">{t("profile.english")}</SelectItem>
            </Select>
          </div>
        </div>
      </div>

      {/* Bildirimler */}
      <div className="glass-card rounded-card p-6">
        <h2 className="text-base font-bold text-tyro-text-primary mb-4">{t("settings.notifications")}</h2>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-tyro-text-primary">{t("settings.emailNotifications")}</p>
              <p className="text-xs text-tyro-text-muted">{t("settings.emailNotificationsDesc")}</p>
            </div>
            <Switch isSelected={emailNotif} onValueChange={setEmailNotif} size="sm" />
          </div>
          <div className="h-px bg-tyro-border" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-tyro-text-primary">{t("settings.browserNotifications")}</p>
              <p className="text-xs text-tyro-text-muted">{t("settings.browserNotificationsDesc")}</p>
            </div>
            <Switch isSelected={browserNotif} onValueChange={setBrowserNotif} size="sm" />
          </div>
        </div>
      </div>

      {/* Entegrasyon */}
      <div className="glass-card rounded-card p-6">
        <h2 className="text-base font-bold text-tyro-text-primary mb-4">{t("settings.integration")}</h2>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-tyro-text-primary">{t("settings.azureAdStatus")}</p>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-600">
              {t("settings.demoMode")}
            </span>
          </div>
          <div className="h-px bg-tyro-border" />
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-tyro-text-primary">{t("settings.dataverseConnection")}</p>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-tyro-bg text-tyro-text-muted">
              {t("settings.notConfigured")}
            </span>
          </div>
        </div>
      </div>

      {/* Hakkında */}
      <div className="glass-card rounded-card p-6">
        <h2 className="text-base font-bold text-tyro-text-primary mb-4">{t("settings.about")}</h2>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-tyro-text-secondary">{t("settings.version")}</p>
            <p className="text-sm font-medium text-tyro-text-primary">1.0.0</p>
          </div>
          <div className="h-px bg-tyro-border" />
          <p className="text-xs text-tyro-text-muted text-center mt-2">TTECH Business Solutions</p>
        </div>
      </div>
    </div>
  );

  const tagsTab = (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="glass-card rounded-card p-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Tag size={18} className="text-tyro-gold" />
            <h2 className="text-base font-bold text-tyro-text-primary">{t("settings.tagManagement")}</h2>
          </div>
          <span className="text-[11px] text-tyro-text-muted">{tagDefinitions.length} etiket</span>
        </div>
        <p className="text-[12px] text-tyro-text-muted mb-4">{t("settings.tagManagementDesc")}</p>

        {/* Tag list */}
        <div className="flex flex-col gap-1.5 mb-4 max-h-[500px] overflow-y-auto">
          {tagDefinitions.map((tag) => {
            const isEditing = editingId === tag.id;
            const usageCount = getUsageCount(tag.name);
            return (
              <div
                key={tag.id}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-tyro-bg/60 hover:bg-tyro-bg border border-transparent hover:border-tyro-border/30 transition-colors group"
              >
                {/* Color picker popover */}
                <Popover placement="bottom-start">
                  <PopoverTrigger>
                    <button
                      type="button"
                      className="w-6 h-6 rounded-full shrink-0 cursor-pointer border-2 border-white shadow-sm hover:scale-110 transition-transform"
                      style={{ backgroundColor: tag.color }}
                      title={t("settings.tagColor")}
                    />
                  </PopoverTrigger>
                  <PopoverContent className="p-3">
                    <p className="text-[11px] font-semibold text-tyro-text-secondary mb-2">{t("settings.tagColor")}</p>
                    <ColorPicker
                      value={tag.color}
                      onChange={(color) => updateTagDefinition(tag.id, { color })}
                    />
                  </PopoverContent>
                </Popover>

                {/* Name — edit or display */}
                {isEditing ? (
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <Input
                      size="sm"
                      variant="bordered"
                      value={editName}
                      onValueChange={setEditName}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEditing(tag.id, tag.name);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      classNames={{ base: "flex-1", inputWrapper: "h-7 min-h-7" }}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => saveEditing(tag.id, tag.name)}
                      className="w-6 h-6 rounded flex items-center justify-center text-tyro-success hover:bg-tyro-success/10 cursor-pointer"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="w-6 h-6 rounded flex items-center justify-center text-tyro-text-muted hover:bg-tyro-bg cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-[13px] font-medium text-tyro-text-primary flex-1 min-w-0 truncate">
                      {tag.name}
                    </span>
                    {usageCount > 0 && (
                      <span className="text-[10px] text-tyro-text-muted shrink-0">
                        {usageCount} hedef
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => startEditing(tag)}
                      className="w-6 h-6 rounded flex items-center justify-center text-tyro-text-muted hover:text-tyro-text-primary hover:bg-tyro-bg cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTag(tag.id, tag.name)}
                      className="w-6 h-6 rounded flex items-center justify-center text-tyro-text-muted hover:text-tyro-danger hover:bg-red-50 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Add new tag */}
        <div className="flex items-center gap-2 pt-3 border-t border-tyro-border/30">
          <Popover placement="bottom-start">
            <PopoverTrigger>
              <button
                type="button"
                className="w-7 h-7 rounded-full shrink-0 cursor-pointer border-2 border-dashed border-tyro-border hover:border-tyro-gold transition-colors"
                style={{ backgroundColor: newTagColor }}
                title={t("settings.tagColor")}
              />
            </PopoverTrigger>
            <PopoverContent className="p-3">
              <p className="text-[11px] font-semibold text-tyro-text-secondary mb-2">{t("settings.tagColor")}</p>
              <ColorPicker value={newTagColor} onChange={setNewTagColor} />
            </PopoverContent>
          </Popover>
          <Input
            size="sm"
            variant="bordered"
            placeholder={t("settings.tagNamePlaceholder")}
            value={newTagName}
            onValueChange={setNewTagName}
            onKeyDown={(e) => { if (e.key === "Enter") handleAddTag(); }}
            classNames={{ base: "flex-1", inputWrapper: "h-8 min-h-8" }}
          />
          <Button
            size="sm"
            color="primary"
            variant="flat"
            isIconOnly
            onPress={handleAddTag}
            isDisabled={!newTagName.trim()}
            className="rounded-lg"
          >
            <Plus size={16} />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader
        title={t("pages.settings.title")}
        subtitle={t("pages.settings.subtitle")}
      />

      <Tabs
        aria-label="Ayarlar sekmeleri"
        variant="underlined"
        color="primary"
        classNames={{
          tabList: "gap-6 border-b border-tyro-border/50 pb-0",
          tab: "px-1 h-10 text-[13px] font-semibold",
          cursor: "h-[2px]",
          panel: "pt-5",
        }}
        style={{ "--heroui-primary": hexToHSL(sidebarTheme.accentColor) } as React.CSSProperties}
      >
        <Tab
          key="general"
          title={
            <div className="flex items-center gap-2">
              <Settings size={15} />
              <span>{t("settings.general")}</span>
            </div>
          }
        >
          {generalTab}
        </Tab>
        <Tab
          key="tags"
          title={
            <div className="flex items-center gap-2">
              <Tag size={15} />
              <span>{t("settings.tagManagement")}</span>
              <span className="ml-0.5 text-[10px] bg-tyro-gold/15 text-tyro-gold px-1.5 py-0.5 rounded-full font-bold">
                {tagDefinitions.length}
              </span>
            </div>
          }
        >
          {tagsTab}
        </Tab>
      </Tabs>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => { confirmAction?.(); setConfirmOpen(false); }}
        message={confirmMessage}
      />
    </div>
  );
}
