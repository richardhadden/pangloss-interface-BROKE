import {
  createEffect,
  createSignal,
  For,
  Match,
  onMount,
  Show,
  Switch,
} from "solid-js";
import { unwrap } from "solid-js/store";
import { useClipboard, useStorage } from "solidjs-use";
import { IoClipboard, IoCloseSharp } from "solid-icons/io";
import { TranslationKey, useTranslation } from "~/contexts/translation";
import { isServer } from "solid-js/web";
import { BiRegularReset } from "solid-icons/bi";
import colors from "tailwindcss/colors";
import {
  BaseNodeDefinitionMap,
  ModelDefinitions,
  ReifiedRelationsDefinitionMap,
  SemanticSpaceDefinitionMap,
} from "../../../.model-configs/model-definitions";
import { deepEqual } from "~/utils/deepEquals";

import { getColour } from "./RelationField";

const LOCALSTORAGE_KEY = "Pangloss";

const [_scratchboard, _setScratchboard] = createSignal<object[]>([]);

function initialiseScratboard() {
  if (!isServer) {
    const initialOnLoad = localStorage.getItem(LOCALSTORAGE_KEY);
    if (initialOnLoad) {
      _setScratchboard(JSON.parse(initialOnLoad));
    }
  }
}

function _copy(item: object) {
  // Check item not already in scratchboard
  if (
    _scratchboard() &&
    (_scratchboard().some(
      (i) => "id" in i && "id" in item && i.id === item.id,
    ) ||
      _scratchboard().some((i) => deepEqual(i, item)))
  ) {
    return;
  }
  const update = _scratchboard()
    ? [..._scratchboard(), unwrap(item)]
    : [unwrap(item)];
  _setScratchboard(update);
  localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(update));
}

function _cut(item: object, removeFunction: () => void) {
  _copy(item);
  setTimeout(() => removeFunction(), 50);
}

function _reset() {
  _setScratchboard([]);
  localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify([]));
}

function _remove(index: number) {
  const update = _scratchboard().filter((item, idx) => idx !== index);
  _setScratchboard(update);
  localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(update));
}

export const scratchboard = {
  items: _scratchboard,
  copy: _copy,
  cut: _cut,
  reset: _reset,
  remove: _remove,
};

function generateLabelForReifiedRelation(item) {
  const [lang, { t }] = useTranslation();

  return (
    <div class="flex w-fit items-center">
      <For each={item.target}>
        {(target) => (
          <div class="flex flex-row">
            <Show when={target.type && target.type in BaseNodeDefinitionMap}>
              <div class="flex-start mr-1 flex h-fit w-fit rounded-xs bg-zinc-400/90 opacity-70 shadow-2xl">
                <div class="flex items-center rounded-l-xs bg-slate-600 px-3 py-2 text-[10px] font-semibold text-nowrap text-slate-100 uppercase select-none">
                  {t[target.type as TranslationKey]._model.verboseName()}
                </div>
                <div class="flex w-fit flex-nowrap items-center pr-4 pl-4 text-[10px]">
                  {trimLabel(target.label)}
                </div>
              </div>
            </Show>
            <Show when={target.type in ReifiedRelationsDefinitionMap}>
              {generateLabelForReifiedRelation(target)}
            </Show>
          </div>
        )}
      </For>
      <Show when={item.type}>
        <For
          each={Object.entries(
            ModelDefinitions[item.type as keyof typeof ModelDefinitions].fields,
          )}
        >
          {([fieldName, field]) => (
            <>
              <Show
                when={
                  fieldName !== "target" && field.metatype === "RelationField"
                }
              >
                <div class="ml-4 flex items-center px-2">
                  <span class="mr-2 text-[10px] font-semibold text-slate-600/70 uppercase">
                    {fieldName}
                  </span>
                  <For each={item[fieldName]}>
                    {(f) => generateLabelForReifiedRelation(f)}
                  </For>
                </div>
              </Show>
              <Show
                when={
                  fieldName !== "target" &&
                  field.metatype === "LiteralField" &&
                  item[fieldName]
                }
              >
                <div class="align-center flex w-fit flex-nowrap items-center pr-4 pl-4 text-[10px] font-semibold text-slate-600/70 uppercase">
                  {t[item.type as TranslationKey][fieldName].verboseName}
                </div>
                <div class="flex items-center rounded-sm bg-zinc-400/30 p-2">
                  {item[fieldName].toString()}
                </div>
              </Show>
            </>
          )}
        </For>
      </Show>
    </div>
  );
}

function trimLabel(label: string) {
  if (label.length > 15) {
    return `${label.substring(0, 15)}...`;
  }
  if (label.length > 0) {
    return label;
  }
  return <i>No label</i>;
}

export const ScratchboardView = () => {
  const [expandScratchboard, setExpandScratchboard] = createSignal(true);
  const [lang, { t }] = useTranslation();
  onMount(() => initialiseScratboard());
  return (
    <Show when={scratchboard.items() && scratchboard.items().length > 0}>
      <div class="fixed right-10 bottom-0 left-30 z-10 flex justify-center">
        <div class="max-w-fit overflow-clip rounded-t-xs bg-slate-500/30 shadow-xl backdrop-blur-2xl">
          <div
            onclick={() => setExpandScratchboard(!expandScratchboard())}
            class="relative flex min-h-8 w-full cursor-pointer items-center bg-slate-600/60 pl-2 text-xs font-semibold text-slate-50 uppercase shadow-sm shadow-slate-500/60 backdrop-blur-2xl select-none hover:bg-slate-700/60 active:bg-slate-600/60"
          >
            <IoClipboard color="white" class="" />{" "}
            <span class="mr-3 ml-2">Clipboard</span>
            <div class="grow" />
            <Show when={expandScratchboard()}>
              <button
                on:click={scratchboard.reset}
                class="group active:slate-300/50 flex aspect-square min-h-8 cursor-pointer items-center justify-center rounded-tr-xs bg-slate-300/50 hover:bg-slate-400/50 active:bg-slate-300/50 active:shadow-inner active:shadow-slate-500/40"
              >
                <BiRegularReset color="white" />
              </button>
            </Show>
          </div>
          <Show when={expandScratchboard()}>
            <div class="flex p-3">
              <For each={scratchboard.items()}>
                {(item, index) => (
                  <Switch
                    fallback={
                      <div class="flex-start ml-2 flex h-fit w-fit rounded-xs bg-zinc-300/80 shadow-sm shadow-slate-500/70">
                        <div class="flex items-center rounded-l-xs bg-slate-600/80 px-3 py-2 text-[10px] font-semibold text-nowrap text-slate-100 uppercase select-none">
                          {t[item.type as TranslationKey]._model.verboseName()}
                        </div>

                        <Show
                          when={item.type in BaseNodeDefinitionMap}
                          fallback={
                            <div class="flex w-fit flex-nowrap items-center pr-1 pl-2 text-xs">
                              {generateLabelForReifiedRelation(item)}
                            </div>
                          }
                        >
                          <div class="flex w-fit flex-nowrap items-center pr-4 pl-4 text-xs">
                            {trimLabel(item.label)}
                          </div>
                        </Show>

                        <button
                          onclick={() => scratchboard.remove(index())}
                          class="group flex aspect-square h-8 cursor-pointer items-center justify-center rounded-r-xs bg-orange-500/70 hover:bg-orange-500/80 active:bg-orange-500/80 active:shadow-inner active:shadow-slate-600/30"
                        >
                          <IoCloseSharp
                            color={colors.slate["100"]}
                            class="group-active:scale-95"
                            size={18}
                          />
                        </button>
                      </div>
                    }
                  >
                    <Match when={item.type in SemanticSpaceDefinitionMap}>
                      <div class="flex-start ml-2 flex h-fit w-fit rounded-xs bg-zinc-300/80 shadow-sm shadow-slate-500/70">
                        <div
                          class={
                            "flex items-center rounded-l-xs px-3 py-2 text-[10px] font-semibold text-nowrap text-slate-100 uppercase select-none " +
                            getColour(item.type).paste
                          }
                        >
                          {t[item.type as TranslationKey]._model.verboseName()}
                        </div>

                        <div class="flex w-fit flex-nowrap items-center pr-4 pl-4 text-xs">
                          Negative
                        </div>

                        <button
                          onclick={() => scratchboard.remove(index())}
                          class="group flex aspect-square h-8 cursor-pointer items-center justify-center rounded-r-xs bg-orange-500/70 hover:bg-orange-500/80 active:bg-orange-500/80 active:shadow-inner active:shadow-slate-600/30"
                        >
                          <IoCloseSharp
                            color={colors.slate["100"]}
                            class="group-active:scale-95"
                            size={18}
                          />
                        </button>
                      </div>
                    </Match>
                  </Switch>
                )}
              </For>
            </div>
          </Show>
        </div>
      </div>
    </Show>
  );
};
