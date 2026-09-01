1. ข้อควรระวัง: กฎพระราชฐาน (Palace Rule) ในหมากรุกไทย

ข้อเท็จจริง: หมากรุกไทยไม่มีกฎพระราชฐาน ขุน (King) และโคน (Khon) สามารถเดินไปได้ทั่วทั้งกระดาน 8x8 (กฎพระราชฐานมีเฉพาะใน หมากรุกจีน / Xiangqi)

คำแนะนำ: หากระบบที่คุณสร้างตั้งใจจำลอง หมากรุกไทยมาตรฐาน ควรลบ describe("กฎพระราชฐาน (Palace)", ...) ออก เพื่อป้องกันไม่ให้ Domain Logic (King.ts และ Khon.ts) ถูกจำกัดขอบเขตการเดินผิดจากความเป็นจริง แต่ถ้าเป็นกติกาดัดแปลงพิเศษ (Custom Variant) ก็สามารถคงส่วนนี้ไว้ได้ครับ

2. ปรับปรุง Test "AI จับหมากที่มีค่าที่สุด" (ป้องกัน Flaky / False Positive)

ใน Test Case ที่ 2 ของ MinimaxEngine:

ปัญหา: captured ถูกดึงค่ามาจาก board.getPieceAt(bestMove.to[0], bestMove.to[1]) ก่อน ที่จะมีการทำ board.makeMove() จริง ค่าที่ได้จึงยังคงเป็นเรือที่วางอยู่บนกระดานก่อนเดิน

แก้ไข: ดึงค่าตัวหมากที่ถูกกินตรงๆ จาก bestMove.capturedPiece จะตรงวัตถุประสงค์และแม่นยำกว่าครับ

it("AI ควรจับหมากตัวที่มีค่าที่สุดเมื่อมีโอกาส (ม้าจับเรือฝั่งแดง)", () => {

  const board = new Board();

  board.setPieceAt(4, 4, new King(Side.BLACK));

  board.setPieceAt(2, 1, new Horse(Side.BLACK));

  board.setPieceAt(0, 4, new King(Side.RED));

  board.setPieceAt(0, 0, new Rook(Side.RED));

  const bestMove = engine.findBestMove(board, Side.BLACK, 1);

  expect(bestMove).not.toBeNull();

  expect(bestMove!.piece.type).toBe(PieceType.HORSE);

  // ตรวจสอบตัวหมากที่ถูกกินจากข้อมูลการเดิน (Move) โดยตรง

  expect(bestMove!.capturedPiece?.type).toBe(PieceType.ROOK);

});

it("AI ควรจับหมากตัวที่มีค่าที่สุดเมื่อมีโอกาส (ม้าจับเรือฝั่งแดง)", () => {

  const board = new Board();

  board.setPieceAt(4, 4, new King(Side.BLACK));

  board.setPieceAt(2, 1, new Horse(Side.BLACK));

  board.setPieceAt(0, 4, new King(Side.RED));

  board.setPieceAt(0, 0, new Rook(Side.RED));

  const bestMove = engine.findBestMove(board, Side.BLACK, 1);

  expect(bestMove).not.toBeNull();

  expect(bestMove!.piece.type).toBe(PieceType.HORSE);

  // ตรวจสอบตัวหมากที่ถูกกินจากข้อมูลการเดิน (Move) โดยตรง

  expect(bestMove!.capturedPiece?.type).toBe(PieceType.ROOK);

});

3. การเช็กเงื่อนไขเบี้ยหงายในกระดานมาตรฐาน (Pawn Promotion Rows)

ใน Test Case การโปรโมตเบี้ย กำหนดให้เบี้ยแดงเริ่มโปรโมตที่ แถว <= 2 และเบี้ยดำที่ แถว >= 5 ซึ่งถูกต้องตรงตามกติกาหมากรุกไทย (เบี้ยหงายเมื่อเดินถึงแถวที่ 3 ของฝั่งตรงข้าม)

คำแนะนำเพิ่มเติม: ควรเพิ่ม Edge Case เช็กว่า เบี้ยที่เดินถอยหลังไม่ได้ และเมื่อโปรโมตเป็น เม็ด (Met) แล้ว สามารถเดินเฉียงถอยหลังตามสิทธิ์ของเม็ดในตาถัดไปได้ถูกต้องด้วยหรือไม่