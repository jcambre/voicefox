/* eslint-disable no-unused-vars */
/* globals log */

export const Routines = ({
  updateNickname,
  registeredNicknames,
  useToggle,
  useEditNicknameDraft,
}) => {
  const draft = useEditNicknameDraft(false, {
    name: "nicknames.combined",
    contexts: [],
  });

  const createRoutine = () => {
    draft.setVisible(true);
  };

  return (
    <div className="settings-content">
      <fieldset>
        <legend>Manage your Routines</legend>
        <div className="description-container">
          <div className="description">
            Create a custom phrase to execute one or more actions.
          </div>
          <div>
            <button
              className="styled-button new-routine-button"
              onClick={() => {
                createRoutine();
              }}
            >
              <span className="plus-sign"> ＋ </span>
              New Routine
            </button>
          </div>
        </div>
        <br></br>
        {draft.isVisible === true ? (
          <EditRoutineDraft
            draft={draft}
            updateNickname={updateNickname}
          ></EditRoutineDraft>
        ) : null}
        <RoutinesList
          registeredNicknames={registeredNicknames}
          updateNickname={updateNickname}
          useToggle={useToggle}
          useEditNicknameDraft={useEditNicknameDraft}
        ></RoutinesList>
      </fieldset>
    </div>
  );
};

const RoutineCard = ({
  nicknameContext,
  useToggle,
  updateNickname,
  useEditNicknameDraft,
}) => {
  const draft = useEditNicknameDraft(false, nicknameContext);
  const allUtterances = [];
  const utterancesContexts = nicknameContext.contexts;
  if (utterancesContexts !== undefined) {
    for (let i = 0; i < utterancesContexts.length - 1; i++) {
      allUtterances.push(utterancesContexts[i].utterance + ", ");
    }
    if (utterancesContexts.length > 0) {
      allUtterances.push(
        utterancesContexts[utterancesContexts.length - 1].utterance
      );
    }
  }
  return (
    <div className="card">
      <RoutineMenu
        useToggle={useToggle}
        nicknameContext={nicknameContext}
        updateNickname={updateNickname}
        useEditNicknameDraft={useEditNicknameDraft}
        draft={draft}
      ></RoutineMenu>
      <h2 className="card-name">"{nicknameContext.nickname}"</h2>
      <h3 className="card-text">{allUtterances}</h3>
      <div>
        {draft.isVisible === true ? (
          <EditRoutineDraft
            draft={draft}
            updateNickname={updateNickname}
            oldNicknameContext={nicknameContext}
          ></EditRoutineDraft>
        ) : null}
      </div>
    </div>
  );
};

const RoutinesList = ({
  registeredNicknames,
  updateNickname,
  useToggle,
  useEditNicknameDraft,
}) => {
  const allNicks = [];

  for (const nick in registeredNicknames) {
    allNicks.push(
      <RoutineCard
        nicknameContext={registeredNicknames[nick]}
        useToggle={useToggle}
        updateNickname={updateNickname}
        useEditNicknameDraft={useEditNicknameDraft}
      ></RoutineCard>
    );
  }

  return <div>{allNicks}</div>;
};

const RoutineMenu = ({ useToggle, nicknameContext, updateNickname, draft }) => {
  const menu = useToggle(false);

  const removeNickname = () => {
    updateNickname(undefined, nicknameContext.nickname);
    menu.setVisible(false);
  };

  const toggleDraft = () => {
    draft.setVisible(true);
    menu.setVisible(false);
  };

  return (
    <div>
      <div>
        <div className="card-menu" ref={menu.ref}>
          <button
            className="no-style-button"
            onClick={() => menu.setVisible(!menu.isVisible)}
          >
            <img src="images/more-horizontal.svg" alt="Routine Actions"></img>
          </button>
          {menu.isVisible === true ? (
            <div className="menu-box">
              <button
                className="no-style-button menu-button"
                onClick={() => toggleDraft()}
              >
                <img
                  src="./images/edit.svg"
                  alt="Edit"
                  className="menu-icon"
                ></img>
                <span> Edit </span>
              </button>
              <button
                className="no-style-button menu-button"
                onClick={() => removeNickname()}
              >
                <img
                  src="./images/delete.svg"
                  alt="Remove"
                  className="menu-icon"
                ></img>
                <span> Remove </span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const EditRoutineDraft = ({ draft, updateNickname, oldNicknameContext }) => {
  const allFieldsCompleted = () => {
    return (
      draft.tempEditableNickname.nickname !== undefined &&
      draft.tempEditableNickname.nickname.length > 0 &&
      draft.tempEditableNickname.intents !== undefined &&
      draft.tempEditableNickname.intents.length > 0
    );
  };
  const save = async () => {
    if (
      draft.tempEditableNickname.nickname === undefined ||
      draft.tempEditableNickname.nickname.length === 0
    ) {
      draft.setErrorMessage("This Routine should have a name.");
      log.error("This routine should have a name");
      return;
    }

    let oldNickname = undefined;
    if (oldNicknameContext !== undefined) {
      oldNickname = oldNicknameContext.nickname;
    }

    const { allowed, error } = await updateNickname(
      draft.tempEditableNickname,
      oldNickname
    );
    if (allowed === true) {
      draft.setVisible(false);
    } else {
      draft.setErrorMessage(error);
    }
  };

  const changeNickname = nickname => {
    draft.setErrorMessage("");
    const nicknameContext = draft.tempEditableNickname;
    nicknameContext.nickname = nickname;
    draft.setTempEditableNickname(nicknameContext);
  };

  return (
    <div className="draft">
      <div className="draft-content">
        <div className="nickname-container">
          <label htmlFor="nickname" className="label-nickname">
            When you say this:
          </label>
          <input
            id="nickname"
            className="styled-input"
            type="text"
            placeholder="Add name here"
            onChange={event => changeNickname(event.target.value)}
            value={draft.tempEditableNickname.nickname}
          />
        </div>
        <UtteranceList draft={draft}></UtteranceList>
        {draft.errorMessage ? (
          <div className="error-message"> {draft.errorMessage} </div>
        ) : null}

        <button
          className="styled-button cancel-button"
          onClick={() => {
            draft.setVisible(false);
          }}
        >
          {" "}
          Cancel{" "}
        </button>
        <button
          className={`styled-button ${
            allFieldsCompleted() ? "save-button-allowed" : "save-button"
          }`}
          onClick={() => {
            save();
          }}
        >
          {" "}
          Save{" "}
        </button>
      </div>
    </div>
  );
};

const UtteranceList = ({ draft }) => {
  const updateUtterance = (utterance, utteranceContext) => {
    draft.setErrorMessage("");
    if (utteranceContext !== undefined) {
      utteranceContext.utterance = utterance;
    } else {
      draft.tempEditableNickname.intents = utterance;
    }
    draft.setTempEditableNickname(draft.tempEditableNickname);
  };

  return (
    <div className="utterances-container">
      <p className="label-nickname">Do this: </p>
      <textarea
        id="utterances"
        className="styled-input textarea-container"
        type="text"
        placeholder="Type your actions here, separated by enter"
        onChange={event => {
          updateUtterance(event.target.value);
        }}
        value={draft.tempEditableNickname.intents}
      />
    </div>
  );
};
