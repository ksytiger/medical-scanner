/**
 * @file upload-missing-rows.js
 * @description missing_rows_df1_not_in_df2.csv 파일을 Supabase 데이터베이스에 업로드하는 스크립트
 * 
 * 이 스크립트는 누락된 의료기관 정보가 담긴 CSV 파일을 파싱하여
 * Supabase의 medical_facilities 테이블에 배치 업로드합니다.
 * 
 * @dependencies
 * - csv-parser: CSV 파일 파싱
 * - @supabase/supabase-js: Supabase 클라이언트
 * - fs: 파일 시스템 접근
 */

import fs from 'fs';
import { parse } from 'csv-parse';
import { createClient } from '@supabase/supabase-js';
import path from 'path';

// 환경 변수에서 Supabase 설정 가져오기
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
    console.error('NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE을 확인해주세요.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CSV 파일 경로
const csvFilePath = path.join(__dirname, '../src/app/data/missing_rows_df1_not_in_df2.csv');

// 배치 크기 (한 번에 처리할 레코드 수)
const BATCH_SIZE = 50;

/**
 * 날짜 문자열을 Date 객체로 변환
 * @param {string} dateStr - 날짜 문자열
 * @returns {Date|null} - 변환된 Date 객체 또는 null
 */
function parseDate(dateStr) {
    if (!dateStr || dateStr.trim() === '') return null;
    
    try {
        // "2025-06-16" 형식 처리
        if (dateStr.includes('-')) {
            return new Date(dateStr);
        }
        // "20250616.0" 형식 처리
        if (dateStr.includes('.')) {
            const dateOnly = dateStr.split('.')[0];
            if (dateOnly.length === 8) {
                const year = dateOnly.substring(0, 4);
                const month = dateOnly.substring(4, 6);
                const day = dateOnly.substring(6, 8);
                return new Date(`${year}-${month}-${day}`);
            }
        }
        // "2025-05-29 11:07:55" 형식 처리
        if (dateStr.includes(' ')) {
            return new Date(dateStr);
        }
        return null;
    } catch (error) {
        console.warn(`날짜 파싱 실패: ${dateStr}`);
        return null;
    }
}

/**
 * 숫자 문자열을 정수로 변환
 * @param {string} numStr - 숫자 문자열
 * @returns {number|null} - 변환된 숫자 또는 null
 */
function parseInteger(numStr) {
    if (!numStr || numStr.trim() === '') return null;
    const num = parseInt(numStr, 10);
    return isNaN(num) ? null : num;
}

/**
 * 숫자 문자열을 소수로 변환
 * @param {string} numStr - 숫자 문자열
 * @returns {number|null} - 변환된 숫자 또는 null
 */
function parseDecimal(numStr) {
    if (!numStr || numStr.trim() === '') return null;
    const num = parseFloat(numStr);
    return isNaN(num) ? null : num;
}

/**
 * CSV 행을 데이터베이스 레코드로 변환
 * @param {Object} row - CSV 행 객체
 * @returns {Object} - 변환된 데이터베이스 레코드
 */
function transformRow(row) {
    return {
        service_name: row['개방서비스명'] || null,
        service_id: row['개방서비스아이디'] || null,
        local_gov_code: row['개방자치단체코드'] || null,
        management_number: row['관리번호'] || null,
        management_authority: row['관리주체'] || null,
        ambulance_general: parseInteger(row['구급차일반']),
        ambulance_special: parseInteger(row['구급차특수']),
        rescue_personnel: parseInteger(row['구조사수']),
        data_update_type: row['데이터갱신구분'] || null,
        data_update_date: parseDate(row['데이터갱신일자']),
        road_postal_code: row['도로명우편번호'] || null,
        road_full_address: row['도로명전체주소'] || null,
        building_number: row['번호'] || null,
        bed_count: parseInteger(row['병상수']),
        business_name: row['사업장명'] || null,
        detailed_business_status: row['상세영업상태명'] || null,
        detailed_business_status_code: row['상세영업상태코드'] || null,
        location_area: parseDecimal(row['소재지면적']),
        location_postal_code: row['소재지우편번호'] || null,
        location_full_address: row['소재지전체주소'] || null,
        location_phone: row['소재지전화'] || null,
        pharmacy_business_area: parseDecimal(row['약국영업면적']),
        business_type: row['업태구분명'] || null,
        business_status_code: row['영업상태구분코드'] || null,
        business_status: row['영업상태명'] || null,
        palliative_care_dept: row['완화의료담당부서명'] || null,
        palliative_care_designation_type: row['완화의료지정형태'] || null,
        medical_institution_type: row['의료기관종별명'] || null,
        medical_personnel_count: parseInteger(row['의료인수']),
        license_date: parseDate(row['인허가일자']),
        license_cancel_date: parseDate(row['인허가취소일자']),
        inpatient_room_count: parseInteger(row['입원실수']),
        reopening_date: parseDate(row['재개업일자']),
        coordinate_x: parseDecimal(row['좌표정보X(EPSG5174)']),
        coordinate_y: parseDecimal(row['좌표정보Y(EPSG5174)']),
        designation_date: parseDate(row['지정일자']),
        designation_cancel_date: parseDate(row['지정취소일자']),
        medical_subject_content: row['진료과목내용'] || null,
        medical_subject_names: row['진료과목내용명'] || null,
        total_area: parseDecimal(row['총면적']),
        total_personnel: parseInteger(row['총인원']),
        last_modified_time: parseDate(row['최종수정시점']),
        initial_designation_date: parseDate(row['최초지정일자']),
        closure_date: parseDate(row['폐업일자']),
        licensed_bed_count: parseInteger(row['허가병상수']),
        closure_start_date: parseDate(row['휴업시작일자']),
        closure_end_date: parseDate(row['휴업종료일자'])
    };
}

/**
 * 배치 단위로 데이터를 Supabase에 삽입
 * @param {Array} batch - 삽입할 데이터 배치
 * @param {number} batchNumber - 배치 번호
 * @returns {Promise<boolean>} - 성공 여부
 */
async function insertBatch(batch, batchNumber) {
    try {
        console.log(`📦 배치 ${batchNumber} 업로드 중... (${batch.length}개 레코드)`);
        
        const { error } = await supabase
            .from('medical_facilities')
            .upsert(batch, { 
                onConflict: 'management_number',
                ignoreDuplicates: false 
            });

        if (error) {
            console.error(`❌ 배치 ${batchNumber} 업로드 실패:`, error);
            return false;
        }

        console.log(`✅ 배치 ${batchNumber} 업로드 완료`);
        return true;
    } catch (err) {
        console.error(`❌ 배치 ${batchNumber} 업로드 중 예외 발생:`, err);
        return false;
    }
}

/**
 * CSV 파일을 읽고 Supabase에 업로드하는 메인 함수
 */
async function uploadCsvToSupabase() {
    console.log('🚀 누락된 데이터 업로드 시작...');
    console.log(`📁 파일 경로: ${csvFilePath}`);
    
    // 파일 존재 확인
    if (!fs.existsSync(csvFilePath)) {
        console.error(`❌ CSV 파일을 찾을 수 없습니다: ${csvFilePath}`);
        process.exit(1);
    }

    const records = [];
    let totalProcessed = 0;
    let successfulBatches = 0;
    let failedBatches = 0;

    return new Promise((resolve, reject) => {
        const parser = parse({
            columns: true,
            skip_empty_lines: true
        });

        parser.on('readable', function() {
            let row;
            while ((row = parser.read()) !== null) {
                try {
                    const transformedRow = transformRow(row);
                    
                    // 필수 필드 검증 (관리번호가 있는 경우만 처리)
                    if (transformedRow.management_number) {
                        records.push(transformedRow);
                    }
                } catch (error) {
                    console.warn('⚠️ 행 변환 실패:', error.message);
                }
            }
        });

        parser.on('end', async () => {
            console.log(`📊 총 ${records.length}개 레코드 파싱 완료`);
            
            // 배치 단위로 처리
            for (let i = 0; i < records.length; i += BATCH_SIZE) {
                const batch = records.slice(i, i + BATCH_SIZE);
                const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
                
                const success = await insertBatch(batch, batchNumber);
                
                if (success) {
                    successfulBatches++;
                    totalProcessed += batch.length;
                } else {
                    failedBatches++;
                }
                
                // 진행률 표시
                const progress = ((i + batch.length) / records.length * 100).toFixed(1);
                console.log(`📈 진행률: ${progress}% (${totalProcessed}/${records.length})`);
                
                // API 레이트 리미트 방지를 위한 지연
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            console.log('\n🎉 업로드 완료!');
            console.log(`✅ 성공한 배치: ${successfulBatches}`);
            console.log(`❌ 실패한 배치: ${failedBatches}`);
            console.log(`📊 총 처리된 레코드: ${totalProcessed}`);
            
            resolve();
        });

        parser.on('error', (err) => {
            console.error('❌ CSV 파일 읽기 실패:', err);
            reject(err);
        });

        // 파일 스트림을 파서에 연결
        fs.createReadStream(csvFilePath).pipe(parser);
    });
}

// 스크립트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
    uploadCsvToSupabase()
        .then(() => {
            console.log('🏁 스크립트 실행 완료');
            process.exit(0);
        })
        .catch((err) => {
            console.error('💥 스크립트 실행 실패:', err);
            process.exit(1);
        });
}

export { uploadCsvToSupabase }; 