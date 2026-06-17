type FieldGroupProps = {
  label: string;
  values: string[];
  selected: string[];
  onChange: (values: string[]) => void;
};

export default function FieldGroup({
  label,
  values,
  selected,
  onChange,
}: FieldGroupProps) {
  function toggle(value: string) {
    onChange(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    );
  }

  return (
    <fieldset className="space-y-3">
      <legend className="label">{label}</legend>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {values.map((value) => (
          <label
            key={value}
            className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition ${
              selected.includes(value)
                ? "border-moss bg-moss/10 text-moss"
                : "border-ink/15 bg-cream text-ink hover:border-moss/50"
            }`}
          >
            <input
              type="checkbox"
              className="h-4 w-4 accent-moss"
              checked={selected.includes(value)}
              onChange={() => toggle(value)}
            />
            {value}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
