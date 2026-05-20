"use client";

import { type ChangeEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FONTS = [
  { value: "", label: "Par défaut" },
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "Helvetica, sans-serif", label: "Helvetica" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "'Times New Roman', serif", label: "Times New Roman" },
  { value: "'Courier New', monospace", label: "Courier" },
  { value: "Verdana, sans-serif", label: "Verdana" },
];

export function LinkInsertForm({
  onInsert,
  onCancel,
}: {
  onInsert: (markdown: string) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [color, setColor] = useState("#EC4899");
  const [size, setSize] = useState("15");
  const [font, setFont] = useState("");
  const [bold, setBold] = useState(false);

  function submit() {
    if (!text || !url) return;
    const parts: string[] = [];
    if (color && color.toLowerCase() !== "#ec4899") parts.push(`color:${color}`);
    if (size && size !== "15") parts.push(`size:${size}`);
    if (font) parts.push(`font:${font}`);
    if (bold) parts.push("bold:1");
    const style = parts.length ? `{${parts.join(";")}}` : "";
    onInsert(`[${text}](${url})${style}`);
    setText("");
    setUrl("");
  }

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <Input
        placeholder="Texte du lien"
        value={text}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setText(e.target.value)}
      />
      <Input
        placeholder="https://..."
        value={url}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
        type="url"
      />
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Couleur</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-9 cursor-pointer rounded border bg-transparent"
            />
            <Input
              value={color}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setColor(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Taille (px)</Label>
          <Input
            type="number"
            min={8}
            max={48}
            value={size}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSize(e.target.value)}
          />
        </div>
        <div className="space-y-1 col-span-2">
          <Label className="text-xs">Police</Label>
          <Select value={font || "_default"} onValueChange={(v) => setFont(v === "_default" ? "" : v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONTS.map((f) => (
                <SelectItem key={f.label} value={f.value || "_default"}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <label className="col-span-2 flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={bold}
            onChange={(e) => setBold(e.target.checked)}
            className="size-4"
          />
          Gras
        </label>
      </div>
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={submit}>
          Insérer
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </div>
  );
}
