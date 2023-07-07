// organize-imports-ignore
import { useContext, useRef, useState } from "react";
import { PopUpContext } from "../../contexts/popUpContext";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/theme-twilight";
// import "ace-builds/webpack-resolver";
import { TerminalSquare } from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { CODE_PROMPT_DIALOG_SUBTITLE } from "../../constants";
import { alertContext } from "../../contexts/alertContext";
import { darkContext } from "../../contexts/darkContext";
import { postValidateCode } from "../../controllers/API";
import { APIClassType } from "../../types/api";

export default function CodeAreaModal({
  value,
  setValue,
  nodeClass,
  setNodeClass,
}: {
  setValue: (value: string) => void;
  value: string;
  nodeClass: APIClassType;
  setNodeClass: (Class: APIClassType) => void;
}) {
  const [open, setOpen] = useState(true);
  const [code, setCode] = useState(value);
  const [loading, setLoading] = useState(false);
  const { dark } = useContext(darkContext);
  const { setErrorData, setSuccessData } = useContext(alertContext);
  const { closePopUp, setCloseEdit } = useContext(PopUpContext);
  const ref = useRef();
  function setModalOpen(x: boolean) {
    setOpen(x);
    if (x === false) {
      setTimeout(() => {
        setCloseEdit("editcode");
        closePopUp();
      }, 300);
    }
  }

  function handleClick() {
    setLoading(true);
    postValidateCode(code)
      .then((apiReturn) => {
        setLoading(false);
        if (apiReturn.data) {
          let importsErrors = apiReturn.data.imports.errors;
          let funcErrors = apiReturn.data.function.errors;
          if (funcErrors.length === 0 && importsErrors.length === 0) {
            setSuccessData({
              title: "Code is ready to run",
            });
            setValue(code);
            setModalOpen(false);
          } else {
            if (funcErrors.length !== 0) {
              setErrorData({
                title: "There is an error in your function",
                list: funcErrors,
              });
            }
            if (importsErrors.length !== 0) {
              setErrorData({
                title: "There is an error in your imports",
                list: importsErrors,
              });
            }
          }
        } else {
          setErrorData({
            title: "Something went wrong, please try again",
          });
        }
      })
      .catch((_) => {
        setLoading(false);
        setErrorData({
          title: "There is something wrong with this code, please review it",
        });
      });
  }

  return (
    <Dialog open={true} onOpenChange={setModalOpen}>
      <DialogTrigger></DialogTrigger>
      <DialogContent className="min-w-[80vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <span className="pr-2">Edit Code</span>
            <TerminalSquare
              strokeWidth={1.5}
              className="h-6 w-6 pl-1 text-primary "
              aria-hidden="true"
            />
          </DialogTitle>
          <DialogDescription>{CODE_PROMPT_DIALOG_SUBTITLE}</DialogDescription>
        </DialogHeader>

        <div className="code-area-modal-editor-div">
          <AceEditor
            value={code}
            mode="python"
            highlightActiveLine={true}
            showPrintMargin={false}
            fontSize={14}
            showGutter
            enableLiveAutocompletion
            theme={dark ? "twilight" : "github"}
            name="CodeEditor"
            onChange={(value) => {
              setCode(value);
            }}
            className="h-full w-full rounded-lg border-[1px] border-gray-300 custom-scroll dark:border-gray-600"
          />
        </div>

        <DialogFooter>
          <Button className="mt-3" onClick={handleClick} type="submit">
            {/* {loading?(<Loading/>):'Check & Save'} */}
            Check & Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
