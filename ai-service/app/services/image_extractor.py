import base64

from langchain_core.messages import HumanMessage

from app.core.llm import llm
from app.schemas.invoice import InventorySlip

structured_llm = llm.with_structured_output(
    InventorySlip,
    include_raw=True,
)


async def extract_image_data(image_bytes: bytes):

    image_base64 = base64.b64encode(image_bytes).decode("utf-8")

    message = HumanMessage(
        content=[
            {
                "type": "text",
                "text": """
You are an inventory invoice parser.

Extract every purchased product from this invoice.

For every product extract:

- product_name
- quantity
- unit
- purchase_price

Also extract the purchase date.

Rules:

- Return every product found on the invoice.
- Do not skip any product.
- Keep the product name exactly as written.
- If quantity is missing, use 1.
- If unit is missing, use "pcs".
- If purchase date is not available, return null.
- Ignore GST, CGST, SGST, discounts, totals, shop name and other invoice information.
- Return only structured data.
"""
            },
            {
                "type": "image_url",
                "image_url": f"data:image/jpeg;base64,{image_base64}",
            },
        ]
    )

    response = await structured_llm.ainvoke([message])

    return response["parsed"]