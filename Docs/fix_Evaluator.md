  public static evaluate(board: Board, aiSide: Side): number {
    const material = this.evaluateStatic(board, aiSide);
    
    // Lazy Evaluation: ถ้าผลต่างคะแนนมากเกินไป ให้ใช้คะแนน Material+PST ทันที
    // (ประหยัดการคำนวณ Mobility ที่ใช้ทรัพยากรสูง)
    if (Math.abs(material) > this.LAZY_EVAL_THRESHOLD) {
      return material;
    }

    let score = material;
    score += this.mobilityScore(board, aiSide);
    score += this.pawnStructureScore(board, aiSide);
    score += this.rookOpenFileScore(board, aiSide);
    score += this.centerControlScore(board, aiSide);
    score += this.pawnOverExtensionScore(board, aiSide);
    
    return score;
  }

  /**
   * Static evaluation: Material + PST + Endgame King Hunt
   * ✅ ต้องใส่ King Hunt ที่นี่ เพื่อให้ทำงานเสมอ แม้จะถูก Lazy Evaluation ตัดจบ
   */
  public static evaluateStatic(board: Board, aiSide: Side): number {
    const totalPieces = this.countPieces(board);
    const isEndgame = totalPieces <= this.ENDGAME_PIECE_THRESHOLD;
    let score = 0;

    // 1. คำนวณ Material + PST
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board.getPieceAt(r, c);
        if (!piece) continue;
        const rowIndex = piece.side === Side.RED ? r : 7 - r;
        let pieceScore = this.PIECE_VALUES[piece.type];
        pieceScore += this.pstBonus(piece.type, rowIndex, c, isEndgame);
        
        if (piece.side === aiSide) {
          score += pieceScore;
        } else {
          score -= pieceScore;
        }
      }
    }

    // 2. ✅ Endgame King Hunt Heuristic (ใส่ที่นี่เพื่อให้ทำงานเสมอ)
    if (isEndgame) {
      const enemySide = aiSide === Side.RED ? Side.BLACK : Side.RED;
      const enemyKingPos = this.findKing(board, enemySide);
      const myKingPos = this.findKing(board, aiSide);

      if (enemyKingPos && myKingPos) {
        // 2.1 ให้คะแนนเมื่อผลักขุนศัตรูไปติดขอบกระดาน
        const edgeDistance = Math.min(
          enemyKingPos[0], 7 - enemyKingPos[0],
          enemyKingPos[1], 7 - enemyKingPos[1]
        );
        score += (3 - edgeDistance) * this.EDGE_DISTANCE_WEIGHT;

        // 2.2 ให้คะแนนเมื่อขุนเราเข้าใกล้ขุนศัตรู (Opposition)
        const kingDist = Math.max(
          Math.abs(enemyKingPos[0] - myKingPos[0]),
          Math.abs(enemyKingPos[1] - myKingPos[1])
        );
        score += (7 - kingDist) * this.KING_PROXIMITY_WEIGHT;
      }
    }

    return score;
  }