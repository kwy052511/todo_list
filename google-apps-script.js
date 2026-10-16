/**
 * Google Apps Script for Post-it Todo List (CRUD API)
 *
 * 대상 구글 시트 ID: 1hEQNvivwiRLFpEb4H_BEKu4uVT5d1ZNPR_deE3BjHTU
 * 시트 헤더 컬럼: timestamp | datetime | category | content | color | state | order
 */

const SPREADSHEET_ID = "1hEQNvivwiRLFpEb4H_BEKu4uVT5d1ZNPR_deE3BjHTU";
const SHEET_NAME = "시트1"; 

function getSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
  
  // 헤더가 비어있을 경우 자동 초기화
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["timestamp", "datetime", "category", "content", "color", "state", "order"]);
  }
  return sheet;
}

/**
 * GET 요청 처리 (Read - 전체 조회 또는 카테고리 필터링)
 */
function doGet(e) {
  try {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return responseJSON({ success: true, data: [] });
    }

    const headers = data[0];
    const rows = data.slice(1);

    const items = rows.map((row) => {
      const obj = {};
      headers.forEach((header, idx) => {
        obj[header] = row[idx];
      });
      return obj;
    });

    const categoryParam = e && e.parameter && e.parameter.category;
    const result = categoryParam && categoryParam !== "전체"
      ? items.filter((item) => String(item.category) === categoryParam)
      : items;

    // order 기준 오름차순 정렬 (순서가 작을수록 화면 앞쪽 배치)
    result.sort((a, b) => Number(a.order || 0) - Number(b.order || 0));

    return responseJSON({ success: true, data: result });
  } catch (error) {
    return responseJSON({ success: false, error: error.toString() });
  }
}

/**
 * POST 요청 처리 (Create, Update, Delete, Reorder)
 */
function doPost(e) {
  try {
    let body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }

    const action = body.action || "create";
    const sheet = getSheet();

    switch (action) {
      // 1. CREATE: 새 메모 추가 시 기존 메모들의 order를 1씩 증가시키고 새 메모를 order 1로 저장
      case "create": {
        const item = body.data || body;
        const timestamp = item.timestamp || Date.now().toString();
        const datetime = item.datetime || new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
        const category = item.category || "할 일";
        const content = item.content || "";
        const color = item.color || "yellow";
        const state = item.state || "active";

        const data = sheet.getDataRange().getValues();
        // 기존 메모들의 order 값을 1씩 밀어줌
        if (data.length > 1) {
          for (let i = 1; i < data.length; i++) {
            const currentOrder = Number(data[i][6]) || i;
            sheet.getRange(i + 1, 7).setValue(currentOrder + 1);
          }
        }

        // 새 메모는 맨 첫 번째 순서인 1 부여
        const newOrder = 1;
        sheet.appendRow([timestamp, datetime, category, content, color, state, newOrder]);

        return responseJSON({
          success: true,
          message: "Created successfully",
          data: { timestamp, datetime, category, content, color, state, order: newOrder },
        });
      }

      // 2. UPDATE: 메모 내용, 카테고리, 상태 등 수정
      case "update": {
        const item = body.data || body;
        const targetTimestamp = String(item.timestamp);
        if (!targetTimestamp) {
          throw new Error("Missing 'timestamp' for update");
        }

        const data = sheet.getDataRange().getValues();
        let rowIndex = -1;

        for (let i = 1; i < data.length; i++) {
          if (String(data[i][0]) === targetTimestamp) {
            rowIndex = i + 1; // 1-indexed sheet row
            break;
          }
        }

        if (rowIndex === -1) {
          throw new Error("Memo not found with timestamp: " + targetTimestamp);
        }

        // 컬럼: timestamp(1), datetime(2), category(3), content(4), color(5), state(6), order(7)
        if (item.category !== undefined) sheet.getRange(rowIndex, 3).setValue(item.category);
        if (item.content !== undefined) sheet.getRange(rowIndex, 4).setValue(item.content);
        if (item.color !== undefined) sheet.getRange(rowIndex, 5).setValue(item.color);
        if (item.state !== undefined) sheet.getRange(rowIndex, 6).setValue(item.state);
        if (item.order !== undefined) sheet.getRange(rowIndex, 7).setValue(Number(item.order));
        sheet.getRange(rowIndex, 2).setValue(new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }));

        return responseJSON({ success: true, message: "Updated successfully" });
      }

      // 3. DELETE: 메모 행 삭제 및 남은 메모 순서 재정렬(1부터 시작)
      case "delete": {
        const targetTimestamp = String(body.timestamp || (body.data && body.data.timestamp));
        if (!targetTimestamp) {
          throw new Error("Missing 'timestamp' for delete");
        }

        const data = sheet.getDataRange().getValues();
        let rowIndex = -1;

        for (let i = 1; i < data.length; i++) {
          if (String(data[i][0]) === targetTimestamp) {
            rowIndex = i + 1;
            break;
          }
        }

        if (rowIndex === -1) {
          throw new Error("Memo not found with timestamp: " + targetTimestamp);
        }

        sheet.deleteRow(rowIndex);

        // 삭제 후 남아있는 행들의 order를 1, 2, 3...으로 순차 정돈
        const remainingData = sheet.getDataRange().getValues();
        if (remainingData.length > 1) {
          for (let i = 1; i < remainingData.length; i++) {
            sheet.getRange(i + 1, 7).setValue(i);
          }
        }

        return responseJSON({ success: true, message: "Deleted successfully" });
      }

      // 4. REORDER: 드래그 앤 드롭 순서 일괄 갱신 (1부터 시작하는 고유 순서)
      case "reorder": {
        const orderList = body.orders; // [{ timestamp: "...", order: 1 }, ...]
        if (!Array.isArray(orderList)) {
          throw new Error("orders array is required for reorder");
        }

        const data = sheet.getDataRange().getValues();
        const map = {};
        orderList.forEach((o) => {
          map[String(o.timestamp)] = Number(o.order);
        });

        for (let i = 1; i < data.length; i++) {
          const ts = String(data[i][0]);
          if (map[ts] !== undefined) {
            sheet.getRange(i + 1, 7).setValue(map[ts]);
          }
        }

        return responseJSON({ success: true, message: "Order updated successfully" });
      }

      default:
        throw new Error("Invalid action: " + action);
    }
  } catch (error) {
    return responseJSON({ success: false, error: error.toString() });
  }
}

function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
