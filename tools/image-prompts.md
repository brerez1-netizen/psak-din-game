# פרומפטים לתמונות התיקים

עשר תמונות, `images/case1.jpg` עד `images/case10.jpg`. יחס גובה-רוחב **16:10**, זה מה
שמסגרת התמונה בשלושת הדפים מצפה לו. עד שהן קיימות הדפים מסתירים את המסגרת ולא נשברים,
אז אפשר להעלות אותן בהדרגה.

אחרי הייצור: לדחוס עם PIL (`quality=86, optimize=True, progressive=True, subsampling=0`)
ולשמור כל קובץ מתחת ל-250KB. מסך המרצה טוען את כולן. את המקורים לשמור ב-`tools/originals/`.

## הכלל שקובע אם תמונה טובה

לא "יפה ובלי טקסט", אלא **האם התמונה סותרת את התשובה**. בתיק 3 התשובה היא שהמפתח חורג
והגובה תקין. אם המודל יצייר בניין שנראה נמוך במיוחד, השאלה נשברת. לכן בכל פרומפט למטה
מסומן במפורש מה חייב להיראות ומה אסור שייראה.

**מה שלא רוצים - לאסור במפורש, לא לתאר את מה שכן רוצים.** "המרווחים פתוחים" לא עבד
במשחק קודם, "אין שום חומר שמשתרע משלב לשלב ורואים דרכם את מה שמאחור" עבד.

## בלוק הסגנון, לצרף לכל אחת מעשר התמונות

```
Editorial architectural photograph, muted desaturated palette of warm ochre, deep
charcoal and aged paper cream. Overcast diffuse daylight, no harsh shadows, no lens
flare. Documentary and restrained, the flat unglamorous look of a professional
liability case file, never a real-estate brochure. Slightly elevated eye level,
35mm, deep focus. Israeli construction context: white plaster, exposed concrete,
aluminium window frames, flat roofs.
No text, no words, no letters, no numbers, no logos, no signage, no readable
writing anywhere in the frame. No people's faces. 16:10 aspect ratio.
```

---

## 1. האדריכל שאיננו

```
A small architecture office storefront at street level, seen from the pavement.
An empty brushed-metal nameplate beside the glass door, and a plain business card
lying face up on the desk visible through the window. Both are deliberately blank.
Interior beyond: a drafting desk, a rolled plan, a task lamp switched off.
MUST NOT show: any writing, any professional title, any diploma or certificate.
```

## 2. גן הילדים הקטן

```
A very small single-storey kindergarten building in an Israeli town, seen from the
playground side. Low structure, roughly 60 square metres, wide windows, a shaded
entrance canopy, small colourful play equipment in the foreground. The building
must read as unmistakably PUBLIC and institutional - a place for many children -
while also reading as physically small and modest.
MUST NOT show: a large or multi-storey building, and no signage or lettering.
```

## 3. שישה מטר וחצי

```
Interior of an unfinished four-storey residential building, standing inside a
living room on a middle floor. Bare grey concrete, formwork marks, no plaster.
The critical detail: a WIDE unsupported opening between two concrete columns, the
beam above spanning a clearly long distance with nothing beneath it in the middle.
The wide span must be the first thing the eye reads.
MUST NOT show: any intermediate column in the middle of that span, and no
prefabricated or factory-made elements.
```

## 4. המחסן שעמד בכל המידות

```
Interior of a single-storey agricultural shed, low roof, wide clear floor. The
critical detail: heavy FACTORY-MADE precast concrete roof beams resting on the side
walls, visibly industrial and prefabricated - smooth machined surfaces, sharp
factory edges, visible end anchorage plates at the beam ends where the tendons
terminate. The roof must read as manufactured elsewhere and lifted into place.
MUST NOT show: cast-in-place concrete with formwork marks on the roof beams, and no
columns in the middle of the floor.
```

## 5. החתימה המושאלת

```
A desk seen from directly above. Two separated groups of objects with a clear gap
between them: on one side a stack of rolled and folded construction drawings, on
the other side a single closed ink pen resting on a blank signature line of an
otherwise empty sheet. An unmarked cash envelope sits between the two groups.
The composition must read as two different hands that never met.
MUST NOT show: any hand actually drawing, any writing, any figures or names.
```

## 6. המתכנן הקודם

```
A meeting table with two chairs on the near side and one empty chair pushed back on
the far side. On the table, one set of construction drawings positioned between the
two occupied places, with a second older and slightly dusty rolled drawing pushed
aside to the far edge near the empty chair. Cold coffee cup by the empty chair.
The absence must be the subject of the photograph.
MUST NOT show: any third person, any writing or names on the drawings.
```

## 7. הקרקע התופחת

```
An exterior wall corner of a two-storey Israeli house, white plaster, photographed
straight on in flat overcast light. The critical detail: pronounced DIAGONAL cracks
running upward at roughly 45 degrees from the corners of a window opening and from
the base of the wall, the classic stair-step pattern of foundation settlement. The
cracks must be clearly diagonal, never vertical and never horizontal.
Ground in the foreground is dry clay soil with wide shrinkage fissures.
MUST NOT show: any collapse or rubble, any scaffolding, any repair work in progress.
```

## 8. שכבה אחת במקום שתיים

```
A rooftop terrace edge in cross-section exposure: a strip of the floor tiling has
been lifted away, revealing beneath it a SINGLE thin bituminous waterproofing sheet
lying directly on the screed, its cut edge visible and clearly one layer only.
Standing water and dark damp staining spread beneath the lifted tiles. The single
thin layer at the exposed edge must be legible as the subject.
MUST NOT show: two stacked membrane layers, no workers, no torch or flame.
```

## 9. הפוליסה שפגה

```
A closed and unmarked document folder lying on a desk in a dim office, a thin layer
of dust on its cover, photographed in cold light from a window. Beside it a wall
calendar with its pages curling, and behind, an office chair turned away. The frame
must feel like time has passed and something lapsed quietly.
MUST NOT show: any dates, any numbers, any readable text on the folder or calendar.
```

## 10. המשרד שנסגר

```
An emptied architecture office: bare walls with pale rectangles where frames once
hung, a stack of sealed cardboard archive boxes in the corner, one plan chest with
its drawers closed, and warm late afternoon light entering through an uncovered
window. Clean and orderly, an office that was closed properly rather than abandoned.
MUST NOT show: mess, damage, or anything that reads as bankruptcy or eviction. No
writing on the boxes.
```
