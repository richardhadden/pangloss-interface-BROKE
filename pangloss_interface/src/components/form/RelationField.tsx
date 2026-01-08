import {
  BaseNodeDefinitionMap,
  IRelationToSemanticSpace,
  ModelDefinitions,
  SemanticSpaceDefinitionMap,
  TSubtypeHierarchy,
  type TRelationFieldDefinition,
} from "../../../.model-configs/model-definitions";
import {
  BaseNodeTypes,
  SemanticSpaceTypes,
} from "../../../.model-configs/model-typescript";
import { RelationToExistingField } from "./RelationToExistingField";
import {
  BiRegularCopy,
  BiRegularCut,
  BiRegularPaste,
  BiRegularPlus,
} from "solid-icons/bi";
import { IoCloseSharp } from "solid-icons/io";
import { createEffect, For, JSXElement, Match, Show, Switch } from "solid-js";
import { FormFields, getOrderFields } from "~/components/form/BaseForm";
import { TranslationKey, useTranslation } from "~/contexts/translation";
import { createBlankObject } from "~/utils/createBlankObject";
import { RenderPasteableInline, scratchboard } from "./Scratchboard";
import { content } from "../../../tailwind.config.cjs";

const InlineFormColours = {
  slate: {
    bar: "bg-slate-600",
    container: "bg-slate-600/10 border-slate-400/20",
    hover: "hover:bg-slate-700/80",
    paste: "bg-slate-600/60 shadow-slate-600/40",
  },
  zinc: {
    bar: "bg-zinc-600 shadow-zinc-600/40",
    container: "bg-zinc-600/10 border-zinc-400/20",
    hover: "hover:bg-zinc-700/80",
    paste: "bg-zinc-600/60",
  },
  red: {
    bar: "bg-red-600/90 shadow-red-600/40",
    container: "bg-red-600/10 border-red-400/20 ",
    hover: "hover:bg-red-700/80",
    paste: "bg-red-600/60",
  },
  amber: {
    bar: "bg-amber-600 shadow-amber-600/40",
    container: "bg-amber-600/10 border-amber-400/20",
    hover: "hover:bg-amber-700/80",
    paste: "bg-amber-600/60",
  },
  green: {
    bar: "bg-green-600 shadow-green-600/40",
    container: "bg-green-600/10 border-green-400/20",
    hover: "hover:bg-green-700/80",
    paste: "bg-green-600/60",
  },
};

export function getColour(modelType: keyof typeof ModelDefinitions) {
  const modelColour =
    InlineFormColours[
      ModelDefinitions[modelType].meta?.colour as keyof typeof InlineFormColours
    ] || InlineFormColours.slate;

  return modelColour;
}

type TInlineFormFieldWrapperProps = {
  children: JSXElement;
  modelLabel: string;
  modelType: keyof typeof ModelDefinitions;
  closeFunction?: () => void;
  item: any;
};

export function InlineFormFieldWrapper(props: TInlineFormFieldWrapperProps) {
  const modelMetatype = ModelDefinitions[props.modelType].meta.metatype;
  const padding =
    modelMetatype === "SemanticSpace" ? "px-4 pb-4 pt-3" : "px-10 pb-4 pt-3";
  const modelColour = getColour(props.modelType);
  return (
    <section
      class={
        "col-span-10 rounded-xs shadow-xl not-first:mt-8 " +
        modelColour.container
      }
    >
      <header
        class={
          "flex h-8 w-full justify-between rounded-t-xs text-sm font-semibold text-slate-100 uppercase shadow-sm select-none " +
          modelColour.bar
        }
      >
        <div class="flex items-center pl-3">{props.modelLabel}</div>
        <div class="grow"></div>

        <Show when={props.closeFunction}>
          <div class="flex">
            <button
              onClick={() =>
                scratchboard.cut(props.item, props.closeFunction as () => void)
              }
              class="group flex aspect-square h-full cursor-pointer items-center justify-center rounded-tr-xs bg-slate-300/40 hover:bg-slate-400/40 active:shadow-inner active:shadow-slate-500/30"
            >
              <div class="group-active:scale-85">
                <BiRegularCut />
              </div>
            </button>
            <button
              onClick={() => scratchboard.copy(props.item)}
              class="group flex aspect-square h-full cursor-pointer items-center justify-center rounded-tr-xs bg-slate-300/40 hover:bg-slate-400/40 active:shadow-inner active:shadow-slate-500/30"
            >
              <div class="group-active:scale-85">
                <BiRegularCopy />
              </div>
            </button>
            <button
              class="group flex aspect-square h-full cursor-pointer items-center justify-center rounded-tr-xs bg-slate-300/50 hover:bg-slate-400/50 active:shadow-inner active:shadow-slate-500/40"
              onClick={props.closeFunction}
            >
              <div class="group-active:scale-85">
                <IoCloseSharp />
              </div>
            </button>
          </div>
        </Show>
      </header>
      <div class="px-4 pt-3 pb-4">{props.children}</div>
    </section>
  );
}

function getCloseFunction(
  value: any[],
  setValue: (value: any) => void,
  fieldDefinition: TRelationFieldDefinition,
  index: number,
): (() => void) | undefined {
  if (
    value.length === 1 &&
    fieldDefinition.validators.MinLen &&
    fieldDefinition.validators.MinLen === 1 &&
    Object.keys(value[0]).length > 0
  ) {
    return () => setValue([{}]);
  }
  if (value.length > 1) {
    return () => {
      setValue(value.filter((item, i) => i !== index));
    };
  }

  return undefined;
}

type TRelationFieldProps = {
  fieldDefinition: TRelationFieldDefinition;
  value: any[];
  setValue: (value: any, ...path: (string | number)[]) => void;
  parentFieldDefinition?: TRelationFieldDefinition;
};

function RelationField(props: TRelationFieldProps) {
  const [lang, { t }] = useTranslation();

  const modelColour = getColour(props.fieldDefinition?.fieldOnModel);

  function onPasteItem(itemToPaste) {
    props.setValue([...props.value, itemToPaste]);
  }

  return (
    <>
      <Switch fallback={<div>Field type missing</div>}>
        <Match when={props.fieldDefinition.createInline && props.value}>
          <For each={props.value}>
            {(item, index) => (
              <Show
                when={Object.keys(item).length !== 0}
                fallback={
                  <RelationFieldTypeSelectorWrapper
                    closeFunction={getCloseFunction(
                      props.value,
                      (value) => props.setValue(value),
                      props.fieldDefinition,
                      index(),
                    )}
                  >
                    <RelationFieldTypeSelector
                      fieldOnModel={
                        props.fieldDefinition
                          .fieldOnModel as keyof typeof ModelDefinitions
                      }
                      fieldDefinitionTypes={props.fieldDefinition.types}
                      onSelectType={(newModelInstance) => {
                        props.setValue(newModelInstance, index());
                      }}
                      value={props.value}
                      parentFieldDefinition={props.parentFieldDefinition}
                    />
                  </RelationFieldTypeSelectorWrapper>
                }
              >
                <InlineFormFieldWrapper
                  modelType={item.type as keyof typeof ModelDefinitions}
                  modelLabel={t[
                    item.type as BaseNodeTypes
                  ]._model.verboseName()}
                  closeFunction={getCloseFunction(
                    props.value,
                    (value) => props.setValue(value),
                    props.fieldDefinition,
                    index(),
                  )}
                  item={item}
                >
                  <FormFields
                    modelName={item.type}
                    fieldNames={getOrderFields(item.type)}
                    baseFormState={item}
                    setBaseFormState={(value, ...path) =>
                      props.setValue(value, index(), ...path)
                    }
                    parentFieldDefinition={props.parentFieldDefinition}
                  />
                </InlineFormFieldWrapper>
              </Show>
            )}
          </For>
          <Show when={props.value.every((o) => o.type)}>
            <>
              <button
                class={
                  "group col-span-10 mt-6 flex h-8 w-full cursor-pointer items-center justify-start rounded-xs shadow-sm " +
                  modelColour.bar +
                  " " +
                  modelColour.hover
                }
                onClick={() => props.setValue([...props.value, {}])}
              >
                <div class="flex aspect-square h-8 items-center justify-center rounded-l-xs bg-slate-800/40 shadow-sm">
                  <BiRegularPlus
                    color="white"
                    size="16"
                    class="inline group-active:scale-80"
                  />{" "}
                </div>
                <span class="ml-4 text-xs font-semibold text-slate-100 uppercase group-active:scale-95">
                  Add New
                </span>
              </button>
              <RenderPasteableInline
                fieldDefinitionTypes={props.fieldDefinition.types}
                onPasteItem={onPasteItem}
              />
            </>
          </Show>
        </Match>
        <Match when={props.value && !props.fieldDefinition.createInline}>
          <RelationToExistingField
            fieldDefinition={props.fieldDefinition}
            value={props.value}
            setValue={(value, ...path) => props.setValue(value, ...path)}
            showSearchBox={true}
          />
        </Match>
      </Switch>
    </>
  );
}

function determineTopLevelTypes(types: (keyof typeof BaseNodeDefinitionMap)[]) {
  //console.log("DT", types);
  const supertypeArrays = types.map((t) => [
    ...ModelDefinitions[t].meta.supertypes.toReversed(),
    t,
  ]);
  //console.log("STArray", supertypeArrays);

  let checkedIndex = 0;
  while (true) {
    const nextValues = supertypeArrays.map((stArr) => stArr[checkedIndex]);

    //console.log("nextValues", checkedIndex, nextValues);

    if (nextValues.some((v) => v === undefined)) {
      return Array.from(
        new Set(supertypeArrays.map((stArr) => stArr[checkedIndex - 1])),
      );
    }

    if (!nextValues.every((v) => v == nextValues[checkedIndex])) {
      return Array.from(
        new Set(supertypeArrays.map((stArr) => stArr[checkedIndex])),
      );
    }
    checkedIndex++;
  }
}

function RelationFieldTypeSelectorWrapper(props: {
  children: JSXElement;
  closeFunction: (() => void) | undefined;
}) {
  return (
    <div class="col-span-10 rounded-xs bg-zinc-400/40 pb-10 shadow-xl not-first:mt-8">
      <div
        class={
          "flex h-8 w-full justify-between rounded-t-xs bg-zinc-500/60 text-sm font-semibold text-slate-100 uppercase shadow-lg"
        }
      >
        <div class="flex items-center pl-3 select-none">Select a type</div>
        <div class="grow"></div>
        <Show when={props.closeFunction}>
          <div>
            <button
              class="group flex aspect-square h-full cursor-pointer items-center justify-center rounded-tr-xs bg-slate-300/50 hover:bg-slate-400/50 active:shadow-inner active:shadow-slate-600/50"
              onclick={props.closeFunction}
            >
              <div class="group-active:scale-85">
                <IoCloseSharp />
              </div>
            </button>
          </div>
        </Show>
      </div>

      {props.children}
    </div>
  );
}

type TRecursiveSubtypeHierarchyProps<T extends BaseNodeTypes> = {
  subtypeHierarchy: TSubtypeHierarchy<T>;
  n: number;
};

type TRelationFieldTypeSelectorProps = {
  fieldOnModel?: keyof typeof ModelDefinitions;
  onSelectType: (newModel: object) => void;
  fieldDefinitionTypes: TRelationFieldProps["fieldDefinition"]["types"];
  value: any[];
  parentFieldDefinition?: TRelationFieldDefinition;
};

function RelationFieldTypeSelector(props: TRelationFieldTypeSelectorProps) {
  const [lang, { t }] = useTranslation();

  let baseNodeTypes: BaseNodeTypes[];

  // Get baseNodeTypes for selector; if we have a blank SemanticSpace, the fieldDefinition
  // metatype will be "RelationToTypeVar"; in which case, use the parent field definition
  // and lookup the basetypes from the SemanticSpace type;
  // otherwise, use the field definition types
  if (
    props.fieldDefinitionTypes[0].metatype === "RelationToTypeVar" &&
    props.parentFieldDefinition &&
    props.fieldOnModel
  ) {
    const thisRelationToSemanticSpace =
      props.parentFieldDefinition?.types.filter(
        (t) => t.metatype === "RelationToSemanticSpace",
      );
    baseNodeTypes = (
      thisRelationToSemanticSpace[0] as IRelationToSemanticSpace
    ).types[0].typeParamsToTypeMap[
      props.fieldDefinitionTypes[0].typeVarName
    ].types
      .filter((t: IRelationToSemanticSpace) => t.metatype === "RelationToNode")
      .map((t: IRelationToSemanticSpace) => t.type);
  } else {
    baseNodeTypes = props.fieldDefinitionTypes
      .filter((t) => t.metatype === "RelationToNode")
      .map((t) => t.type);
  }

  const topLevelBaseNodeTypes =
    baseNodeTypes.length > 0
      ? determineTopLevelTypes(
          baseNodeTypes as unknown as (keyof typeof BaseNodeDefinitionMap)[],
        ).sort()
      : [];

  const semanticSpaceTypes = props.fieldDefinitionTypes.filter(
    (t) => t.metatype === "RelationToSemanticSpace",
  );

  const semanticSpaceTypeModels = semanticSpaceTypes.flatMap((t) => t.types);

  const allowedSemanticSpaceTypes = semanticSpaceTypeModels.map(
    (t) => t.baseType,
  );

  const selectBaseNodeType = (baseNodeType: BaseNodeTypes) => {
    props.onSelectType(createBlankObject(baseNodeType, false));
  };

  const selectSemanticSpaceType = (
    semanticSpaceType: SemanticSpaceTypes,
    baseNodeModel: object,
  ) => {
    const semanticSpaceModel = createBlankObject(semanticSpaceType, false);
    semanticSpaceModel.contents = [baseNodeModel];
    props.onSelectType(semanticSpaceModel);
  };

  function shouldDisable(type: BaseNodeTypes) {
    return (
      !baseNodeTypes.includes(type) || BaseNodeDefinitionMap[type].meta.abstract
    );
  }

  function onPaste(item: object) {
    props.onSelectType(item);
  }

  function RecurseSubtypeHierarchy<T extends BaseNodeTypes>(
    props: TRecursiveSubtypeHierarchyProps<T>,
  ): JSXElement {
    return (
      <>
        <For each={Object.entries(props.subtypeHierarchy)}>
          {([subtype, SH]) => (
            <Show
              when={
                baseNodeTypes.includes(subtype as BaseNodeTypes) ||
                BaseNodeDefinitionMap[
                  subtype as BaseNodeTypes
                ].meta.subtypes.some((t) => baseNodeTypes.includes(t))
              }
            >
              <button
                class="group box-content flex cursor-pointer justify-start bg-slate-600 px-3 py-2 text-xs font-semibold text-slate-200 uppercase select-none not-last:border-b-[0.5px] not-last:border-slate-400 last:rounded-b-xs hover:bg-slate-700 active:bg-slate-600 active:shadow-inner active:shadow-slate-700 disabled:cursor-auto disabled:bg-slate-600/70 disabled:text-slate-100/70 disabled:hover:bg-slate-600/70 disabled:active:shadow-none"
                style={`margin-left: ${props.n + 1}rem`}
                onClick={() => selectBaseNodeType(subtype as BaseNodeTypes)}
                disabled={shouldDisable(subtype as BaseNodeTypes)}
              >
                <div
                  classList={{
                    "group-active:scale-[98%] group-hover:scale-[101%]":
                      !shouldDisable(subtype as BaseNodeTypes),
                  }}
                >
                  {
                    t[subtype as TranslationKey]._model
                      .verboseName as unknown as string
                  }{" "}
                </div>
              </button>
              <RecurseSubtypeHierarchy
                subtypeHierarchy={SH as TSubtypeHierarchy<T>}
                n={props.n + 1}
              />
            </Show>
          )}
        </For>
      </>
    );
  }

  return (
    <>
      <Show when={topLevelBaseNodeTypes.length > 0}>
        <>
          <Show
            when={
              scratchboard.items().length > 0 &&
              scratchboard
                .items()
                .some(
                  (item) =>
                    item.type &&
                    (baseNodeTypes.includes(item.type) ||
                      allowedSemanticSpaceTypes.includes(item.type)),
                )
            }
          >
            <div class="w-full px-10">
              <div class="border-b border-b-zinc-400/40 pt-8 pb-8">
                <For each={scratchboard.items()}>
                  {(item) => (
                    <>
                      <Show when={baseNodeTypes.includes(item.type)}>
                        <div class="mb-2 flex overflow-clip rounded-xs not-last:mb-4">
                          <div class="flex">
                            <div class="flex w-fit flex-row bg-zinc-400/60 shadow-2xl">
                              <div class="flex items-center bg-slate-600/60 px-3 py-2 text-xs font-semibold text-nowrap text-slate-100 uppercase select-none">
                                {t[
                                  item.type as TranslationKey
                                ]._model.verboseName()}
                              </div>

                              <div class="flex w-fit flex-nowrap items-center pr-4 pl-4 text-sm text-black/60 select-none">
                                {item.label || <i>...</i>}
                              </div>
                            </div>
                          </div>
                          <button
                            class="group flex aspect-square h-10 cursor-pointer items-center justify-center rounded-r-xs bg-green-500/80 hover:bg-green-500/90 active:bg-green-500/80 active:shadow-inner active:shadow-slate-600/30"
                            onclick={() => onPaste(item)}
                          >
                            <BiRegularPaste color="white" size={14} />
                          </button>
                        </div>
                      </Show>
                      <Show
                        when={allowedSemanticSpaceTypes.includes(item.type)}
                      >
                        <div class="mb-2 flex overflow-clip rounded-xs not-last:mb-4">
                          <div class="flex w-fit flex-row bg-zinc-400/60 shadow-2xl">
                            <div
                              class={
                                "flex items-center px-3 py-2 text-xs font-semibold text-nowrap text-slate-100 uppercase select-none " +
                                getColour(item.type).paste
                              }
                            >
                              {t[
                                item.type as TranslationKey
                              ]._model.verboseName()}
                            </div>

                            <div class="flex w-fit flex-nowrap items-center pr-1 pl-1 text-sm text-black/60 select-none">
                              <For each={item.contents}>
                                {(contentItem) => (
                                  <div class="flex w-fit flex-row rounded-xs bg-zinc-300/60 shadow-2xl">
                                    <div class="flex items-center rounded-l-xs bg-slate-600/60 px-3 py-2 text-[10px] font-semibold text-nowrap text-slate-100 uppercase select-none">
                                      {t[
                                        contentItem.type as TranslationKey
                                      ]._model.verboseName()}
                                    </div>

                                    <div class="flex w-fit flex-nowrap items-center pr-4 pl-4 text-xs text-black/60 select-none">
                                      {contentItem.label || <i>...</i>}
                                    </div>
                                  </div>
                                )}
                              </For>
                            </div>
                          </div>
                          <button
                            class="group flex aspect-square h-10 cursor-pointer items-center justify-center rounded-r-xs bg-green-500/80 hover:bg-green-500/90 active:bg-green-500/80 active:shadow-inner active:shadow-slate-600/30"
                            onclick={() => onPaste(item)}
                          >
                            <BiRegularPaste color="white" size={14} />
                          </button>
                        </div>
                      </Show>
                    </>
                  )}
                </For>
              </div>
            </div>
          </Show>
          <div
            class="flex h-fit w-full gap-x-6"
            classList={{
              "p-10":
                props.fieldDefinitionTypes[0].metatype !== "RelationToTypeVar",
              "pt-10 px-10 pb-4":
                props.fieldDefinitionTypes[0].metatype === "RelationToTypeVar",
            }}
          >
            <For each={topLevelBaseNodeTypes}>
              {(topLevelType, index) => (
                <div class="flex flex-col">
                  <button
                    class="group box-content flex cursor-pointer justify-start rounded-t-xs rounded-bl-xs bg-slate-600 px-3 py-2 text-xs font-semibold text-slate-200 uppercase select-none not-last:border-b-[0.5px] not-last:border-slate-400 hover:bg-slate-700 active:bg-slate-600 active:shadow-inner active:shadow-slate-700 disabled:cursor-auto disabled:bg-slate-600/70 disabled:text-slate-100/70 disabled:hover:bg-slate-600/70 disabled:active:shadow-none"
                    onClick={() => selectBaseNodeType(topLevelType)}
                    disabled={shouldDisable(topLevelType)}
                  >
                    <div
                      classList={{
                        "group-active:scale-[98%] group-hover:scale-[101%]":
                          !shouldDisable(topLevelType),
                      }}
                    >
                      {
                        t[topLevelType as TranslationKey]._model
                          .verboseName as unknown as string
                      }
                    </div>
                  </button>
                  <RecurseSubtypeHierarchy
                    subtypeHierarchy={
                      ModelDefinitions[topLevelType].meta.subtypeHierarchy
                    }
                    n={0}
                  />
                </div>
              )}
            </For>
          </div>
        </>
      </Show>
      <For each={semanticSpaceTypeModels}>
        {(semanticSpaceType) => (
          <div class="mt-10 flex h-fit w-full gap-x-6">
            <div
              class={
                "mx-10 w-full overflow-clip rounded-xs " +
                getColour(semanticSpaceType.baseType).container
              }
            >
              <div
                class={
                  "w-full rounded-t-xs px-3 py-2 text-xs font-semibold text-red-100 uppercase shadow-sm select-none " +
                  getColour(semanticSpaceType.baseType).bar
                }
              >
                {t[semanticSpaceType.baseType]._model.verboseName()}
              </div>
              <RelationFieldTypeSelector
                fieldDefinitionTypes={
                  semanticSpaceType.typeParamsToTypeMap[
                    Object.keys(semanticSpaceType.typeParamsToTypeMap)[0]
                  ].types
                }
                onSelectType={(baseNodeModel) =>
                  selectSemanticSpaceType(
                    semanticSpaceType.baseType as unknown as SemanticSpaceTypes,
                    baseNodeModel as unknown as object,
                  )
                }
                value={props.value}
              />
            </div>
          </div>
        )}
      </For>
    </>
  );
}

export { RelationField };
