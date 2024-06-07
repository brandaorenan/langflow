from datetime import datetime, timezone
from typing import AsyncIterator, Iterator, Optional

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from langchain_core.prompt_values import ImagePromptValue
from langchain_core.prompts.image import ImagePromptTemplate
from pydantic import BaseModel, ConfigDict, Field, field_serializer

from langflow.schema.record import Record


class Message(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    # Helper class to deal with image data
    text: Optional[str | AsyncIterator | Iterator] = Field(default="")
    sender: str
    sender_name: str
    files: Optional[list[str]] = Field(default=[])
    session_id: Optional[str] = Field(default="")
    timestamp: str = Field(default=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"))
    flow_id: Optional[str] = None

    def to_lc_message(
        self,
    ) -> BaseMessage:
        """
        Converts the Record to a BaseMessage.

        Returns:
            BaseMessage: The converted BaseMessage.
        """
        # The idea of this function is to be a helper to convert a Record to a BaseMessage
        # It will use the "sender" key to determine if the message is Human or AI
        # If the key is not present, it will default to AI
        # But first we check if all required keys are present in the data dictionary
        # they are: "text", "sender"
        if self.text is None or not self.sender:
            raise ValueError("Missing required keys ('text', 'sender') in Message.")

        if self.sender == "User":
            if self.files:
                contents = [{"type": "text", "text": self.text}]
                for file_path in self.files:
                    image_template = ImagePromptTemplate()
                    image_prompt_value: ImagePromptValue = image_template.invoke(input={"path": file_path})
                    contents.append({"type": "image_url", "image_url": image_prompt_value.image_url})
                human_message = HumanMessage(content=contents)
            else:
                human_message = HumanMessage(
                    content=[{"type": "text", "text": self.text}],
                )

            return human_message

        return AIMessage(content=self.text)

    @classmethod
    def from_record(cls, record: Record) -> "Message":
        """
        Converts a BaseMessage to a Record.

        Args:
            record (BaseMessage): The BaseMessage to convert.

        Returns:
            Record: The converted Record.
        """
        return cls(
            text=record.text,
            sender=record.sender,
            sender_name=record.sender_name,
            files=record.files,
            session_id=record.session_id,
            timestamp=record.timestamp,
            flow_id=record.flow_id,
        )

    @field_serializer("text", mode="plain")
    def serialize_text(self, value):
        if isinstance(value, AsyncIterator):
            return ""
        elif isinstance(value, Iterator):
            return ""
        return value
