import { createStore, unwrap } from "solid-js/store";
import { BaseNodeTypes } from "../../../.model-configs/model-typescript";
import { createBlankObject } from "~/utils/createBlankObject";
import { apiClient } from "~/apiClient";
import { createShortcut } from "@solid-primitives/keyboard";
import { createSignal, Show } from "solid-js";
import { IoCloseSharp } from "solid-icons/io";
import colors from "tailwindcss/colors";
import { BaseForm } from "./BaseForm";
import { Spinner, SpinnerType } from "solid-spinner";

type TCreateInlineFormProps = {
  itemType: BaseNodeTypes;
  onClose: () => void;
  onSuccessfulCreate: (item: any) => void;
};

function CreateInlineForm(props: TCreateInlineFormProps) {
  const [formState, setFormState] = createStore(
    createBlankObject(props.itemType, false),
  );

  const [submitting, setSubmitting] = createSignal(false);

  const onSubmit = async () => {
    setSubmitting(true);
    const response = await apiClient.create(props.itemType, unwrap(formState));
    if (response) {
      props.onSuccessfulCreate(response);
      props.onClose();
    }
    setSubmitting(false);
  };

  let boxRef!: HTMLDivElement;

  const handleBackgroundClick = (e: Event) => {
    if (!boxRef.contains(e.target as HTMLElement)) {
      props.onClose();
    }
  };

  createShortcut(
    ["Escape"],
    () => {
      props.onClose();
    },
    { preventDefault: true, requireReset: false },
  );

  return (
    <div
      class="fixed top-0 right-0 left-12 z-20 flex h-dvh items-center justify-center bg-slate-500/50 px-20"
      // onClick={handleBackgroundClick} Removed as closes on selection menu click
    >
      <div
        class="min-w-1/2 rounded-xs bg-slate-300/50 shadow-2xl shadow-slate-900/70 backdrop-blur-2xl"
        ref={boxRef}
      >
        <div class="flex h-14 rounded-t-xs shadow-sm shadow-slate-400">
          <div class="flex h-full items-center rounded-tl-xs bg-slate-400/50 px-4 text-sm font-semibold text-slate-800 uppercase select-none">
            New
          </div>
          <div class="text-s flex h-full items-center bg-slate-800/80 px-4 text-sm font-semibold text-slate-100 uppercase select-none">
            {props.itemType}
          </div>
          <Show when={formState.label.length > 0}>
            <div
              class="line-clamp-2 flex h-full w-fit shrink-1 grow-0 items-center rounded-r-sm border-r-[0.25px] border-r-neutral-400/20 bg-zinc-300 pr-6 pl-6 align-middle text-black shadow-2xl shadow-neutral-300/50"
              classList={{
                "text-sm":
                  formState.label.length > 100 && formState.label.length <= 300,
                "text-xs": formState.label.length > 300,
              }}
            >
              <span class="line-clamp-2">
                {formState.label.length > 0
                  ? formState.label
                  : `New ${formState.type}`}
              </span>
            </div>
          </Show>
          <div class="grow" />
          <button
            id="controlBarSaveButton"
            class="group group-hover:shadow-300/40 shadow-g group/button flex aspect-square h-full cursor-pointer items-center justify-center bg-orange-500/70 group-hover:shadow-md last:rounded-tr-xs hover:bg-orange-500/70 hover:shadow-orange-300/40 active:bg-orange-400/70 active:shadow-inner active:shadow-orange-500/30"
            onclick={props.onClose}
          >
            <IoCloseSharp
              color={colors.slate["100"]}
              class="group-active:scale-95"
              size={20}
            />
          </button>
        </div>
        <div class="rounded-b-xs bg-white/30 px-4 py-4 backdrop-blur-2xl">
          <BaseForm
            formFor={props.itemType}
            baseFormState={formState}
            setBaseFormState={setFormState}
          />
        </div>
        <div class="flex w-full justify-center py-3">
          <button
            class="group text-md box-border flex items-center justify-center rounded-xs bg-green-700/90 px-6 py-4 font-semibold text-white uppercase outline-none hover:bg-green-800 hover:shadow-xl hover:shadow-green-700/10 focus:shadow-green-700/10 active:bg-green-700 active:shadow-inner active:shadow-green-900 disabled:bg-slate-600/80"
            classList={{ "cursor-pointer": !submitting() }}
            onclick={onSubmit}
            disabled={submitting()}
          >
            <Show
              when={submitting()}
              fallback={<span class="group-active:scale-[98%]">Create</span>}
            >
              Creating
              <Spinner
                type={SpinnerType.puff}
                color={colors.slate[300]}
                width={24}
                height={24}
                class="ml-4"
              />
            </Show>
          </button>
        </div>
      </div>
    </div>
  );
}

export { CreateInlineForm, type TCreateInlineFormProps };
